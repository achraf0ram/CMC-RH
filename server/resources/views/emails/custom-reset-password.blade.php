<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Réinitialisation du mot de passe - CMC</title>
</head>
<body style="background: #f4f6fb; font-family: Arial, sans-serif; margin: 0; padding: 0;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background: #f4f6fb; padding: 40px 0;">
        <tr>
            <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; background: #fff; border-radius: 12px; box-shadow: 0 2px 8px #0001; overflow: hidden;">
                    <tr>
                        <td style="background: linear-gradient(90deg, #2563eb 0%, #22c55e 100%); padding: 24px 0; text-align: center;">
                            <span style="font-size: 28px; color: #fff; font-weight: bold; letter-spacing: 2px;">CMC</span>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 32px 32px 24px 32px; text-align: left;">
                            <h2 style="color: #2563eb; margin-bottom: 12px;">Réinitialisation de votre mot de passe</h2>
                            <p style="color: #334155; font-size: 16px; margin-bottom: 24px;">Bonjour,</p>
                            <p style="color: #334155; font-size: 15px; margin-bottom: 24px;">
                                Nous avons reçu une demande de réinitialisation du mot de passe pour votre compte CMC.<br>
                                Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe :
                            </p>
                            <div style="text-align: center; margin: 32px 0;">
                                <a href="{{ config('app.frontend_url') }}/reset-password?token={{ $token }}&email={{ urlencode($email) }}" style="background: linear-gradient(90deg, #2563eb 0%, #22c55e 100%); color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: bold; display: inline-block;">Réinitialiser le mot de passe</a>
                            </div>
                            <p style="color: #64748b; font-size: 14px; margin-bottom: 0;">
                                Si vous n'avez pas demandé cette opération, vous pouvez ignorer ce message.<br>
                                Ce lien expirera dans 60 minutes pour des raisons de sécurité.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="background: #f4f6fb; color: #94a3b8; text-align: center; font-size: 13px; padding: 18px 0; border-top: 1px solid #e2e8f0;">
                            © {{ date('Y') }} CMC RH. Tous droits réservés.
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html> 