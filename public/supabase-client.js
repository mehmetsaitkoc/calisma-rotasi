let clientPromise = null;
let configPromise = null;

export async function getPublicConfig(){
  if(!configPromise){
    configPromise=(async()=>{
      const response = await fetch('/api/public-config', { cache: 'no-store' });
      if(!response.ok) throw new Error('Çalışma Rotası bulut ayarları alınamadı.');
      return response.json();
    })();
  }
  return configPromise;
}

export async function getSupabase(){
  if(clientPromise) return clientPromise;
  clientPromise = (async()=>{
    const config = await getPublicConfig();
    const cloud = config?.supabase || {};
    if(!cloud.enabled || !cloud.url || !cloud.publishableKey) return null;
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.116.0/+esm');
    return createClient(cloud.url, cloud.publishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
  })();
  return clientPromise;
}

export function safeNext(value, fallback='/'){
  if(typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) return fallback;
  try {
    const url = new URL(value, location.origin);
    return url.origin === location.origin ? url.pathname + url.search + url.hash : fallback;
  } catch {
    return fallback;
  }
}
