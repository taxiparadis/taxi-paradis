import asyncio
import io
import wave
import subprocess
import time
import struct
from faster_whisper import WhisperModel
from opensip import UserAgent, Account

print("Încarc modelul Whisper Ultra-Rapid...")
# MODIFICARE VITEZĂ: Trecem pe modelul "tiny" (de 5 ori mai rapid pe CPU, răspuns sub 1 secundă)
model = WhisperModel("tiny", device="cpu", compute_type="int8")
print("Modelul Whisper este pregătit.")

def pcm_to_wav(pcm_data):
    wav_buffer = io.BytesIO()
    with wave.open(wav_buffer, "wb") as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(8000)
        wav.writeframes(pcm_data)
    wav_buffer.seek(0)
    return wav_buffer

def resample_cubic_louder(pcm_data, orig_rate, target_rate=8000, vol_mult=2.5):
    samples = list(struct.unpack(f"<{len(pcm_data)//2}h", pcm_data))
    ratio = orig_rate / target_rate
    target_length = int(len(samples) / ratio)
    output_samples = []
    for i in range(target_length):
        pos = i * ratio
        idx = int(pos)
        frac = pos - idx
        sample = samples[idx] * (1 - frac) + samples[idx + 1] * frac if idx + 1 < len(samples) else samples[idx]
        sample = int(sample * vol_mult)
        if sample > 32767: sample = 32767
        elif sample < -32768: sample = -32768
        output_samples.append(sample)
    return struct.pack(f"<{len(output_samples)}h", *output_samples)

def genereaza_voce(text):
    print("Generez vocea...")
    text_file = "mesaj_piper.txt"
    wav_file = "raspuns_piper.wav"
    with open(text_file, "w", encoding="utf-8") as f:
        f.write(text)
    comanda = ["py", "-m", "piper", "--model", "ro_RO-lili-high.onnx", "--output_file", wav_file]
    with open(text_file, "r", encoding="utf-8") as f_in:
        subprocess.run(comanda, stdin=f_in, check=True)
    with wave.open(wav_file, "rb") as wav:
        orig_rate = wav.getframerate()
        pcm_brut = wav.readframes(wav.getnframes())
    return resample_cubic_louder(pcm_brut, orig_rate, 8000, vol_mult=3.0)

async def reda_audio_in_apel(call, pcm_voce):
    start_time = time.perf_counter()
    pachete_trimise = 0
    for i in range(0, len(pcm_voce), 320):
        chunk = pcm_voce[i:i + 320]
        if len(chunk) < 320:
            chunk = chunk + b'\x00' * (320 - len(chunk))
        call.write_pcm(chunk)
        pachete_trimise += 1
        next_package_time = start_time + (pachete_trimise * 0.02)
        sleep_time = next_package_time - time.perf_counter()
        if sleep_time > 0:
            await asyncio.sleep(sleep_time)

ua = UserAgent(local_addr=("0.0.0.0", 5060))

@ua.on_incoming_call
async def proceseaza_apel(call):
    print("\n[SUCCES] APEL INTERCEPTAT!")
    try:
        await call.answer()
    except Exception:
        return
    
    # 1. Salutul inițial
    try:
        pcm_voce = genereaza_voce("Buna ziua, ati sunat la Taxi Paradis. Va rugam sa spuneti comanda.")
        await reda_audio_in_apel(call, pcm_voce)
    except Exception as e:
        print("Eroare voce:", e)
        
    # 2. Înregistrarea redusă la 6 secunde (suficient pentru a spune o stradă și un număr)
    print("Ascult clientul (6 secunde)...")
    audio_buffer = bytearray()
    call.on_pcm(lambda pcm: audio_buffer.extend(pcm))
    await asyncio.sleep(6)  # Tăiat de la 10 la 6 secunde pentru a elimina timpii morți
    call.on_pcm(None)
    
    if len(audio_buffer) == 0:
        return

    # 3. Transcrierea fulger cu modelul Tiny
    try:
        wav_data = pcm_to_wav(audio_buffer)
        print("Transcriu instantaneu...")
        
        # Whisper tiny procesează 6 secunde de audio în mai puțin de 0.5 secunde!
        segments, info = model.transcribe(
            wav_data, 
            beam_size=3,  # Redus de la 5 la 3 pentru un plus de viteză
            language="ro",
            initial_prompt="Comandă taxi, strada, numărul, Petre Puican, aleea Carpați, 37, 10."
        )
        text_transcris = " ".join([seg.text for seg in segments]).strip()
        print(f"Adresă detectată: {text_transcris}")
        
        if text_transcris:
            mesaj_confirmare = f"Am inteles comanda. Masina porneste spre {text_transcris}. Va multumim."
            mesaj_confirmare = mesaj_confirmare.replace(".", "").replace(",", "")
            
            pcm_confirmare = genereaza_voce(mesaj_confirmare)
            await reda_audio_in_apel(call, pcm_confirmare)
            
    except Exception as e:
        print("Eroare:", e)
        
    print("Închid apelul...")
    try:
        if hasattr(call, 'hangup'): await call.hangup()
        elif hasattr(call, 'close'): await call.close()
    except Exception: pass

async def main():
    cont = Account(
    username="1003",
    password="robot",
    domain="192.168.0.110"
)
    await ua.start()
    await ua.register(cont)
    print("Telefonul virtual Taxi Paradis este ONLINE și FAST!")
    while True:
        await asyncio.sleep(1)

if __name__ == "__main__":
    asyncio.run(main())
