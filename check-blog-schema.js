const { createClient } = require("@supabase/supabase-js")

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSchema() {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .limit(1)
    
  if (data && data.length > 0) {
    console.log("Blog post sütunları:")
    console.log(Object.keys(data[0]))
  }
}

checkSchema()
