import asyncio
import wave

from opensip import UserAgent, Account


ua = UserAgent(
    local_addr=("192.168.0.121", 5062)
)


def citeste_wav(path):
    w = wave.open(path, "rb")

    frames = w.readframes(w.getnframes())

    w.close()

    return frames


async def trimite_audio(call):

    print("INCERC AUDIO")

    audio = citeste_wav(
        "/home/paradis2027/Desktop/taxi-paradis/raspuns_telefon.wav"
    )

    bucata = 160

    for i in range(0, len(audio), bucata):

        if not call.is_active:
            break

        pcm = audio[i:i+bucata]

        await call.write_pcm(pcm)

        await asyncio.sleep(0.02)


    print("AUDIO GATA")


async def incoming_call(call):

    print("APEL NOU")

    await call.answer()

    print("APEL RASPUNS")

    await asyncio.sleep(1)

    await trimite_audio(call)

    await asyncio.sleep(2)

    await call.hangup()

    print("APEL INCHIS")


async def main():

    cont = Account(
        username="1003",
        password="robot",
        domain="192.168.0.121"
    )


    ua.on_incoming_call(incoming_call)

    await ua.start()

    await ua.register(cont)


    print("AI TAXI PARADIS 1003 ONLINE")


    while True:
        await asyncio.sleep(1)



if __name__ == "__main__":
    asyncio.run(main())
