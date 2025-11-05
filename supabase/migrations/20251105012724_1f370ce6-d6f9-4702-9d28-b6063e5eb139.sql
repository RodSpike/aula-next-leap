-- Create trigger to ensure free users get immediate access post-confirmation
-- Trigger will execute our idempotent handle_new_user on auth.users inserts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();
