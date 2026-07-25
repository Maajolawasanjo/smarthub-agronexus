import socket
import ssl

project_ref = "jlzjyulcvqsdiqrxrrgo"
password = "Smarthub-agrochain"
regions = [
    "eu-west-1", "eu-central-1", "eu-west-2", "eu-west-3", "eu-north-1",
    "us-east-1", "us-east-2", "us-west-1", "us-west-2", "ca-central-1",
    "ap-south-1", "ap-southeast-1", "ap-southeast-2", "ap-northeast-1", "ap-northeast-2", "sa-east-1"
]

for r in regions:
    host = f"aws-0-{r}.pooler.supabase.com"
    for port in [5432, 6543]:
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.settimeout(1.5)
            s.connect((host, port))
            s.close()
            print(f"FOUND OPEN HOST: {host}:{port}")
        except Exception as e:
            pass
