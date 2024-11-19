# client.py
import socket
import select
def receive_fix_select(sock):
    ready = select.select([sock], [], [], timeout=5.0)
    if ready[0]:
        return sock.recv(8192)
    return None


def receive_fix(sock):
    data = sock.recv(8192)  # Adjust buffer size based on your needs
    messages = data.split(b'\x01')
    return [msg.decode('utf-8') for msg in messages if msg]

def receive_fix_message(sock):
    # Standard FIX message ends with 0x01 (SOH)
    message = b''
    while True:
        byte = sock.recv(4096)
        if not byte:
            break
        message += byte
        if byte == b'\x01':  # SOH character
            break
    return message.decode('utf-8')

def recieve_method(sock):
    buffer = b""
    while True:
        try:
            data = sock.recv(4096)
            if not data:
                print("Connection closed by server")
                break
            
            buffer += data
            while b"\x01" in buffer:
                msg_end = buffer.find(b"\x01") + 1
                msg = buffer[:msg_end]
                buffer = buffer[msg_end:]
                
                print(f"Received: {msg.decode('utf-8').replace(chr(1), '|')}")
                
        except Exception as e:
            print(f"Error receiving message: {e}")
            break
    
function_list = [receive_fix, receive_fix_message, receive_fix_select, recieve_method]
def start_client():
    # Create a TCP/IP socket
    client_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    
    # Remote server details
    server_address = ('fix.dytechlab.com', 5100)
    print(f"Connecting to {server_address}")
    
    try:
        # Connect to the server
        client_socket.connect(server_address)
        print("Connected successfully!")
        
        while True:
            # Get message from user
            message = '8=FIX.4.2|9=79|35=A|49=OPS_CANDIDATE_10_8372|56=DTL|34=1|52=20241119-20:52:17.498|98=0|108=30|10=179|'
            if message.lower() == 'quit':
                break
            
            # Send message
            client_socket.send(message.encode('utf-8'))
            
            # Receive response
            try:
                for idx, fun in enumerate(function_list):
                    response = fun(client_socket)
                    
                    print(f"Server response_{idx}: {response}\n")
                    
            except Exception as e:
                print("Raw response:", response, e)
            
    except ConnectionRefusedError:
        print("Connection refused. Please check if the server is running and the address is correct.")
    except socket.gaierror:
        print("Address error. Please check if the hostname is correct.")
    except socket.timeout:
        print("Connection timed out. Please check your internet connection or if the server is responsive.")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        print("Closing connection")
        client_socket.close()





if __name__ == '__main__':
    start_client()

