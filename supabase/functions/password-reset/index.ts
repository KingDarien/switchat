import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PasswordResetRequest {
  email: string;
  action: 'request' | 'confirm';
  token?: string;
  newPassword?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { email, action, token, newPassword }: PasswordResetRequest = await req.json();
    const clientIP = req.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    if (action === 'request') {
      // Check if user can request password reset (rate limiting)
      const { data: canRequest } = await supabase.rpc('can_request_password_reset', {
        email_param: email
      });

      if (!canRequest) {
        return new Response(
          JSON.stringify({ 
            error: 'Too many reset attempts. Please wait 24 hours before trying again.' 
          }),
          {
            status: 429,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          }
        );
      }

      // Generate secure token
      const resetToken = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      // Check if email exists in auth.users
      const { data: userData } = await supabase.auth.admin.getUserByEmail(email);
      
      if (!userData.user) {
        // Still log the attempt for security monitoring, but don't reveal if email exists
        await supabase.from('password_reset_requests').insert({
          email,
          token: resetToken,
          ip_address: clientIP,
          user_agent: userAgent,
          expires_at: expiresAt.toISOString(),
          is_suspicious: true,
          user_id: null
        });

        // Return success anyway to prevent email enumeration
        return new Response(
          JSON.stringify({ 
            message: 'If the email exists, a reset link has been sent.' 
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          }
        );
      }

      // Log reset request
      await supabase.from('password_reset_requests').insert({
        email,
        user_id: userData.user.id,
        token: resetToken,
        ip_address: clientIP,
        user_agent: userAgent,
        expires_at: expiresAt.toISOString(),
        is_suspicious: false
      });

      // Send password reset email using Supabase Auth
      const { error: resetError } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email,
        options: {
          redirectTo: `${req.headers.get('origin')}/auth?mode=reset&token=${resetToken}`
        }
      });

      if (resetError) {
        console.error('Error sending reset email:', resetError);
        return new Response(
          JSON.stringify({ error: 'Failed to send reset email' }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          }
        );
      }

      return new Response(
        JSON.stringify({ 
          message: 'If the email exists, a reset link has been sent.' 
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );

    } else if (action === 'confirm' && token && newPassword) {
      // Validate reset token
      const { data: resetRequest } = await supabase
        .from('password_reset_requests')
        .select('*')
        .eq('token', token)
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (!resetRequest) {
        return new Response(
          JSON.stringify({ error: 'Invalid or expired reset token' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          }
        );
      }

      if (!resetRequest.user_id) {
        return new Response(
          JSON.stringify({ error: 'Invalid reset request' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          }
        );
      }

      // Update user password
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        resetRequest.user_id,
        { password: newPassword }
      );

      if (updateError) {
        console.error('Error updating password:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update password' }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          }
        );
      }

      // Mark token as used
      await supabase
        .from('password_reset_requests')
        .update({ used_at: new Date().toISOString() })
        .eq('id', resetRequest.id);

      return new Response(
        JSON.stringify({ message: 'Password updated successfully' }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('Error in password-reset function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);