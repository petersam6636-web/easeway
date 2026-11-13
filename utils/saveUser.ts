
import { supabase } from "@/lib/supabase-client";

export async function saveLoggedInUser() {
  // Get the currently authenticated user
  const { data: { user }, error: authError } =
    await supabase.auth.getUser();

  if (authError) {
    throw new Error(authError.message);
  }

  if (!user) {
    throw new Error("No authenticated user found.");
  }

  if (!user.email) {
    throw new Error("User email is unavailable.");
  }

  // Save user details into easeway_users
  const { data, error } = await supabase
    .from("easeway_users")
    .upsert(
      {
        id: user.id,
        email: user.email,
      },
      {
        onConflict: "id",
      }
    )
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
