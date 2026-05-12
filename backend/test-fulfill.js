import fetch from 'node-fetch';

async function test() {
  const loginRes = await fetch('http://localhost:8787/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 's2@example.com', password: 'password123' })
  });
  
  const loginData = await loginRes.json();
  const token = loginData.token;
  
  console.log("Token acquired.");
  
  const start = Date.now();
  const fulfillRes = await fetch('http://localhost:8787/api/orders/fulfillment', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  console.log(`Status: ${fulfillRes.status}`);
  console.log(`Time: ${Date.now() - start}ms`);
  
  const data = await fulfillRes.json();
  console.log(`Orders: ${data.orders?.length}, Tasks: ${data.tasks?.length}`);
}

test();
