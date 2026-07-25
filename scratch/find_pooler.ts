import net from 'net';

const projectRef = "jlzjyulcvqsdiqrxrrgo";
const regions = [
  "eu-west-1", "eu-central-1", "eu-west-2", "eu-west-3", "eu-north-1",
  "us-east-1", "us-east-2", "us-west-1", "us-west-2", "ca-central-1",
  "ap-south-1", "ap-southeast-1", "ap-southeast-2", "ap-northeast-1", "ap-northeast-2", "sa-east-1"
];

async function checkRegion(region: string) {
  const host = `aws-0-${region}.pooler.supabase.com`;
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(2000);
    socket.on('connect', () => {
      socket.destroy();
      resolve(`${region}: PORT OPEN`);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(`${region}: TIMEOUT`);
    });
    socket.on('error', (err) => {
      resolve(`${region}: ERROR ${err.message}`);
    });
    socket.connect(6543, host);
  });
}

async function main() {
  console.log("Testing Supabase Pooler Regions...");
  const results = await Promise.all(regions.map(r => checkRegion(r)));
  results.forEach(r => console.log(r));
}

main();
