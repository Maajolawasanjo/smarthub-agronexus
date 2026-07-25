import subprocess

project_ref = "jlzjyulcvqsdiqrxrrgo"
db_pass = "Smarthub-agrochain"

regions = [
    "eu-west-1", "eu-central-1", "eu-west-2", "eu-west-3", "eu-north-1",
    "us-east-1", "us-east-2", "us-west-1", "us-west-2", "ca-central-1",
    "ap-south-1", "ap-southeast-1", "ap-southeast-2", "ap-northeast-1", "ap-northeast-2", "sa-east-1"
]

for r in regions:
    host = f"aws-0-{r}.pooler.supabase.com"
    url = f"postgresql://postgres.{project_ref}:{db_pass}@{host}:6543/postgres?pgbouncer=true&sslmode=require"
    cmd = f"DATABASE_URL='{url}' npx tsx scratch/test_registration.ts"
    res = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=10)
    out = res.stdout.strip() + "\n" + res.stderr.strip()
    first_line = [l for l in out.splitlines() if l.strip()][:2]
    print(f"Region {r:15s} => {' '.join(first_line)}")
