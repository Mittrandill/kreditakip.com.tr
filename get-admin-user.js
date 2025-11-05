const { createClient } = require("@supabase/supabase-js")

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function getAdminUser() {
  // Try to get the first user from auth.users
  const { data: { users }, error } = await supabase.auth.admin.listUsers()
  
  if (error) {
    console.error("Error:", error)
    return
  }
  
  if (users && users.length > 0) {
    console.log("First user ID:", users[0].id)
    console.log("Email:", users[0].email)
  } else {
    console.log("No users found")
  }
}

getAdminUser()
