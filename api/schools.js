import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);
export default async function handler(req,res){
  res.setHeader("Access-Control-Allow-Origin","*");
  if(req.method==="OPTIONS")return res.status(200).end();
  const{q="",limit=8}=req.query;
  if(!q||q.length<2)return res.status(200).json([]);
  try{
    const schools=await sql`SELECT id,name,city,state,zip,school_type FROM schools WHERE name ILIKE ${"%" +q+"%"} OR city ILIKE ${"%"+q+"%"} OR zip ILIKE ${"%"+q+"%"} ORDER BY name LIMIT ${parseInt(limit)}`;
    res.status(200).json(schools);
  }catch(e){console.error(e);res.status(500).json({error:"Datenbankfehler"});}
}
