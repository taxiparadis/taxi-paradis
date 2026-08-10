import socket
import time
import re

IP_LOCAL = "0.0.0.0"
PORT_LOCAL = 6060  # Sau portul pe care l-ați setat ultima dată

def porneste_centrala():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.bind((IP_LOCAL, PORT_LOCAL))
    except Exception as e:
        print(f"❌ Închide complet MicroSIP înainte să pornești scriptul!")
        return

    print("🚀 Centrala TAXI-PARADIS este ONLINE!")
    print(f"📌 Adresa: {IP_LOCAL}:{PORT_LOCAL}\n")

    while True:
        try:
            data, addr = s.recvfrom(4096)
            mesaj = data.decode('utf-8', errors='ignore')

            if "REGISTER sip:" in mesaj:
                print(f"🔄 Conectare primită de la MicroSIP de la {addr[0]}:{addr[1]}...")
                try:
                    call_id = mesaj.split('Call-ID:')[1].split('\r\n')[0].strip()
                    cseq = mesaj.split('CSeq:')[1].split('\r\n')[0].strip()
                except:
                    call_id = "12345"
                    cseq = "1 REGISTER"
                
                # REPARAT: Răspunsul folosește acum adresa IP reală a clientului (addr[0])
                raspuns = (
                    f"SIP/2.0 200 OK\r\n"
                    f"Via: SIP/2.0/UDP {addr[0]}:{addr[1]};branch=z9hG4bK\r\n"
                    f"From: <sip:100@{addr[0]}>\r\n"
                    f"To: <sip:100@{addr[0]}>;tag=12345\r\n"
                    f"Call-ID: {call_id}\r\n"
                    f"CSeq: {cseq}\r\n"
                    f"Contact: <sip:100@{addr[0]}:{PORT_LOCAL}>\r\n"
                    f"Content-Length: 0\r\n\r\n"
                )
                s.sendto(raspuns.encode('utf-8'), addr)
                print("✅ MicroSIP este aprobat și s-a făcut VERDE!")

            elif "INVITE sip:" in mesaj:
                print(f"📞 APEL PRIMIT de la client!")
                try:
                    call_id = mesaj.split('Call-ID:')[1].split('\r\n')[0].strip()
                    cseq = mesaj.split('CSeq:')[1].split('\r\n')[0].strip()
                except:
                    call_id = "12345"
                    cseq = "1 INVITE"

                ok = f"SIP/2.0 200 OK\r\nVia: SIP/2.0/UDP {addr[0]}:{addr[1]}\r\nCall-ID: {call_id}\r\nCSeq: {cseq}\r\nContent-Length: 0\r\n\r\n"
                s.sendto(ok.encode('utf-8'), addr)
                
                print("🤖 ROBOT: Bună ziua! Mașina 55 vine spre adresa dvs.!")
                time.sleep(2)

                bye = f"BYE sip:100@{addr[0]}:{addr[1]} SIP/2.0\r\nVia: SIP/2.0/UDP {addr[0]}:{PORT_LOCAL}\r\nCall-ID: {call_id}\r\nCSeq: 2 BYE\r\n\r\n"
                s.sendto(bye.encode('utf-8'), addr)
                print("✅ Apel finalizat.\n")
        except Exception as e:
            print(f"Eroare: {e}")

if __name__ == "__main__":
    porneste_centrala()
