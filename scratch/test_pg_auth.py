import subprocess
import os

db_pass = "Smarthub-agrochain"
project_ref = "jlzjyulcvqsdiqrxrrgo"

hosts = [
    "aws-0-eu-west-1.pooler.supabase.com",
    "aws-0-eu-central-1.pooler.supabase.com",
    "aws-0-eu-west-2.pooler.supabase.com",
    "aws-0-us-east-1.pooler.supabase.com",
    "aws-0-ap-southeast-1.pooler.supabase.com"
]

for host in hosts:
    for port in [5432, 6543]:
        url = f"postgresql://postgres.{project_ref}:{db_pass}@{host}:{port}/postgres?sslmode=require"
        cmd = ["npx", "tsx", "-e", f"import {{ prisma }} from './src/lib/prisma'; process.env.DATABASE_URL='{url}'; prisma.user.count().then(c => console.log('SUCCESS! {host}:{port} count=' + c)).catch(e => console.log('FAIL {host}:{port}: ' + e.message.split('\\n')[0]))"]
        try:
            res = subprocess.run(cmd, capture_output=True, text=True, timeout=5)
            out = res.stdout.strip() or res.stderr.strip()
            print(out)
            if "SUCCESS" in out:
                print(f"***** WORKING DATABASE_URL: {url} *****")
                break
        except Exception as e:
            print(f"TIMEOUT {host}:{port}")
