export default async function Home() {
  const res = await fetch("http://localhost:8000/api/test/", {
    cache: "no-store",
  });

  const data = await res.json();

  return (
    <div>
      <h1>Hello Its AI Sabai World</h1>
    </div>
  );
}