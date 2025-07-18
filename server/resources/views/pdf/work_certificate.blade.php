<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Attestation de Travail</title>
    <style>
        body { font-family: DejaVu Sans, Arial, Helvetica, sans-serif; margin: 40px; }
        .header { text-align: center; margin-bottom: 30px; }
        .title { font-size: 22px; font-weight: bold; margin-bottom: 10px; }
        .info-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        .info-table td { padding: 8px 4px; font-size: 16px; }
        .label { font-weight: bold; color: #333; }
        .footer { margin-top: 40px; text-align: right; font-size: 15px; }
        .bordered { border: 1px solid #ccc; padding: 10px; border-radius: 8px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">Attestation de Travail</div>
        <div>Centre Médico-Chirurgical</div>
    </div>
    <div class="bordered">
        <table class="info-table">
            <tr>
                <td class="label">Nom complet :</td>
                <td>{{ $certificate->full_name }}</td>
            </tr>
            <tr>
                <td class="label">Matricule :</td>
                <td>{{ $certificate->matricule }}</td>
            </tr>
            <tr>
                <td class="label">Grade :</td>
                <td>{{ $certificate->grade ?? '-' }}</td>
            </tr>
            <tr>
                <td class="label">Date d'embauche :</td>
                <td>{{ $certificate->hire_date ? date('d/m/Y', strtotime($certificate->hire_date)) : '-' }}</td>
            </tr>
            <tr>
                <td class="label">Fonction :</td>
                <td>{{ $certificate->function ?? '-' }}</td>
            </tr>
            <tr>
                <td class="label">Objet :</td>
                <td>{{ $certificate->purpose }}</td>
            </tr>
            @if($certificate->additional_info)
            <tr>
                <td class="label">Informations supplémentaires :</td>
                <td>{{ $certificate->additional_info }}</td>
            </tr>
            @endif
        </table>
    </div>
    <div class="footer">
        Fait à Casablanca, le {{ date('d/m/Y') }}<br>
        <br>
        Signature et cachet
    </div>
</body>
</html> 