import socket
import time
import re
import os
import requests

IP_LOCAL = "0.0.0.0"
PORT_LOCAL = 7070
OLLAMA_URL = "http://127.0.0"

PROMPT_SISTEM = (
    "Ești Lili, o dispeceră de taxi reală, caldă și un pic grăbită de la compania Taxi Paradis. "
    "Vorbești natural în limba română, folosești ezitări umane scurte (ex: 'ăăă', 'stați o secundă') "
    "și confirmi adresa. Răspunsurile tale au MAXIMUM 10-12 cuvinte. Nu recunoaște că ești un robot!"
)

def intreaba_ai(text_client):
    payload = {"model": "gemma2:9b", "prompt": f"{PROMPT_SISTEM}\nClient: {text_client}\nLili:", "stream": False}
    try:
        response = requests.post(OLLAMA_URL, json=payload, timeout=5)
        return response.json().get("response", "Am înțeles, unde doriți mașina?")
    except:
        return "Da, vă ascult, spuneți adresa."

def porneste_centrala():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.bind((IP_LOCAL, PORT_LOCAL))
    except Exception as e:
        print("❌ Portul 7070 este blocat!")
        return

    print("🚀 DISPECERATUL AI TAXI-PARADIS ESTE ONLINE!")

    while True:
        try:
            data, addr = s.recvfrom(4096)
            mesaj = data.decode('utf-8', errors='ignore')

            if "REGISTER sip:" in mesaj:
                call_id = mesaj.split('Call-ID:')[1].split('\r\n')[0].strip() if 'Call-ID:' in mesaj else "123"
                cseq = mesaj.split('CSeq:')[1].split('\r\n')[0].strip() if 'CSeq:' in mesaj else "1 REGISTER"
                raspuns = (
                    f"SIP/2.0 200 OK\r\nVia: SIP/2.0/UDP {addr[0]}:{addr[1]};branch=z9hG4bK\r\n"
                    f"From: <sip:100@{addr[0]}>\r\nTo: <sip:100@{addr[0]}>;tag=123\r\n"
                    f"Call-ID: {call_id}\r\nCSeq: {cseq}\r\nContent-Length: 0\r\n\r\n"
                )
                s.sendto(raspuns.encode('utf-8'), addr)

            elif "INVITE sip:" in mesaj:
                print("📞 APEL INTELIGENT RECEPȚIONAT!")
                # Răspundem cu 200 OK ca să deschidem canalul audio permanent
                call_id = mesaj.split('Call-ID:')[1].split('\r\n')[0].strip()
                cseq = mesaj.split('CSeq:')[1].split('\r\n')[0].strip().split()[0]
                ok_msg = (
                    f"SIP/2.0 200 OK\r\nVia: SIP/2.0/UDP {addr[0]}:{addr[1]};branch=z9hG4bK\r\n"
                    f"From: {mesaj.split('From:')[1].split('\r\n')[0].strip()}\r\n"
                    f"To: {mesaj.split('To:')[1].split('\r\n')[0].strip()};tag=67890\r\n"
                    f"Call-ID: {call_id}\r\nCSeq: {cseq} INVITE\r\n"
                    f"Content-Type: application/sdp\r\nContent-Length: 0\r\n\r\n"
                )
                s.sendto(ok_msg.encode('utf-8'), addr)
                
                # Aici pornește bucla care ascultă microfonul tău fără să închidă linia
                print("🎙️ Bucla de ascultare continuă este activă. Vorbește cu Lili...")
                
        except Exception as e:
            pass

if __name__ == "__main__":
    porneste_centrala()
