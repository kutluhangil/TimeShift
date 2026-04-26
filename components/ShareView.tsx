import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

export default function ShareView() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<{ imageParams: string, type: 'polaroid' | 'album' } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/share/${id}`)
      .then(res => {
        if (!res.ok) throw new Error("Share not found");
        return res.json();
      })
      .then(setData)
      .catch(err => setError(err.message));
  }, [id]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-4">
        <h1 className="text-4xl font-semibold tracking-tight mb-4">Memory Lost</h1>
        <p className="text-xl text-neutral-400">{error}</p>
        <Link to="/" className="mt-8 px-6 py-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors">Return to TimeShift</Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black p-4 sm:p-8">
      <div className="absolute inset-0 bg-gradient-to-b from-neutral-900 via-black to-black opacity-80 z-0 pointer-events-none"></div>
      <div className="max-w-4xl w-full flex flex-col items-center justify-center relative z-10">
        <img src={data.imageParams} alt="Shared Memory" className="max-w-full max-h-[80vh] shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-sm border-[12px] border-white" />
        <Link to="/" className="mt-12 relative px-8 py-4 bg-white text-black font-semibold rounded-full overflow-hidden shadow-[0_0_40px_rgba(255,255,255,0.15)] hover:shadow-[0_0_60px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95 transition-all duration-300">
          Create Your Own Timeline
        </Link>
      </div>
    </div>
  );
}
