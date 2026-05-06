import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);
export default async function handler(req,res){
  if(req.method==="GET"){
    const{group_id}=req.query;
    if(!group_id)return res.status(400).json({error:"group_id fehlt"});
    try{const entries=await sql`SELECT*FROM entries WHERE group_id=${group_id} ORDER BY created_at DESC LIMIT 50`;res.status(200).json(entries);}
    catch(e){res.status(500).json({error:"Datenbankfehler"});}
    return;
  }
  if(req.method==="POST"){
    const{group_id,subject,text,due_date,priority,author_name,for_child,user_id}=req.body;
    if(!group_id||!subject||!text||!author_name)return res.status(400).json({error:"Pflichtfelder fehlen"});
    try{
      const[entry]=await sql`INSERT INTO entries(group_id,author_id,author_name,subject,text,due_date,priority,for_child)VALUES(${group_id},${user_id||"anonymous"},${author_name},${subject},${text},${due_date||null},${priority||"normal"},${for_child||null})RETURNING*`;
      res.status(201).json(entry);
    }catch(e){console.error(e);res.status(500).json({error:"Datenbankfehler"});}
    return;
  }
  res.status(405).json({error:"Method not allowed"});
}
