import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);
export default async function handler(req,res){
  if(req.method!=="POST")return res.status(405).json({error:"Method not allowed"});
  const{user_id,school_id,grade,section,display_name,children}=req.body;
  if(!user_id||!school_id||!grade||!display_name)return res.status(400).json({error:"Pflichtfelder fehlen"});
  try{
    let[group]=await sql`SELECT*FROM groups WHERE school_id=${school_id} AND grade=${grade} AND section=${section||null} AND school_year='2025/26'`;
    if(!group)[group]=await sql`INSERT INTO groups(school_id,grade,section,school_year)VALUES(${school_id},${grade},${section||null},'2025/26')ON CONFLICT(school_id,grade,section,school_year)DO UPDATE SET updated_at=now()RETURNING*`;
    let[member]=await sql`SELECT*FROM members WHERE user_id=${user_id} AND group_id=${group.id}`;
    const isFirst=group.member_count===0;
    if(!member)[member]=await sql`INSERT INTO members(user_id,group_id,display_name,children,status,is_admin)VALUES(${user_id},${group.id},${display_name},${JSON.stringify(children||[])},${ isFirst?"active":"pending"},${isFirst})RETURNING*`;
    const[school]=await sql`SELECT name FROM schools WHERE id=${school_id}`;
    res.status(200).json({group:{...group,school_name:school?.name},member});
  }catch(e){console.error(e);res.status(500).json({error:"Datenbankfehler"});}
}
