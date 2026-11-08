import {NextRequest,NextResponse} from 'next/server';
export const dynamic='force-dynamic';export const revalidate=0;
const slugs:Record<string,string>={'Premier League':'eng.1','La Liga':'esp.1','Champions League':'uefa.champions','Serie A':'ita.1','Bundesliga':'ger.1'};
const n=(stats:any[],key:string)=>{const x=stats.find((s:any)=>s.name===key);if(!x||x.value==null||x.displayValue==='')return null;const value=Number(x.value);return Number.isFinite(value)?value:null};
export async function GET(req:NextRequest){
 const league=req.nextUrl.searchParams.get('league')??'',slug=slugs[league];
 if(!slug)return NextResponse.json({error:'Choose a supported league table.'},{status:400,headers:{'Cache-Control':'no-store'}});
 try{
  const response=await fetch(`https://site.api.espn.com/apis/v2/sports/soccer/${slug}/standings`,{cache:'no-store',headers:{Accept:'application/json','User-Agent':'FootyPulseHub/1.0 (league standings)'},signal:AbortSignal.timeout(12000)});
  if(!response.ok)return NextResponse.json({error:`ESPN standings feed returned HTTP ${response.status}.`},{status:502,headers:{'Cache-Control':'no-store'}});
  const data=await response.json();
  const groups=(data.children??[]).map((group:any)=>({name:group.name??'Table',rows:(group.standings?.entries??[]).map((entry:any)=>{const stats=entry.stats??[];return {id:String(entry.team?.id??entry.id),team:entry.team?.displayName??entry.team?.name??'Unknown team',abbreviation:entry.team?.abbreviation??'',logo:entry.team?.logos?.[0]?.href??null,rank:n(stats,'rank'),rankChange:n(stats,'rankChange'),played:n(stats,'gamesPlayed'),wins:n(stats,'wins'),draws:n(stats,'ties'),losses:n(stats,'losses'),goalsFor:n(stats,'pointsFor'),goalsAgainst:n(stats,'pointsAgainst'),goalDifference:n(stats,'pointDifferential'),points:n(stats,'points'),record:stats.find((s:any)=>s.name==='overall')?.displayValue??null}}).sort((a:any,b:any)=>(a.rank??999)-(b.rank??999))}));
  return NextResponse.json({league:data.name??league,groups,source:'ESPN',retrievedAt:new Date().toISOString()},{headers:{'Cache-Control':'no-store, max-age=0'}});
 }catch(e){const message=e instanceof Error?e.message:'Unknown upstream error';return NextResponse.json({error:`Standings unavailable: ${message}`},{status:502,headers:{'Cache-Control':'no-store'}})}
}
