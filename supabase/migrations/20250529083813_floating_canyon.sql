-- Create function to handle user events
CREATE OR REPLACE FUNCTION handle_auth_user_event()
RETURNS trigger AS $$
BEGIN
  -- Call the edge function based on the event type
  PERFORM
    net.http_post(
      url := current_setting('app.settings.edge_function_url') || '/handle-signup',
      body := json_build_object(
        'type', TG_OP,
        'record', row_to_json(NEW)
      )::text,
      headers := json_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      )
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for user events
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_auth_user_event();