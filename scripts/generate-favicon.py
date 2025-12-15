#!/usr/bin/env python3
"""
Script para gerar favicon a partir da logo DTE
Cria versões em diferentes tamanhos para compatibilidade
"""

from PIL import Image, ImageDraw
import os

# Caminhos
logo_path = "/home/ubuntu/dte-system/client/public/logo-dte.png"
output_dir = "/home/ubuntu/dte-system/client/public"

# Carregar imagem original
img = Image.open(logo_path)

# Converter para RGBA se necessário
if img.mode != 'RGBA':
    img = img.convert('RGBA')

# Criar máscara circular
def create_circular_image(image, size):
    # Redimensionar mantendo proporção
    image = image.resize((size, size), Image.Resampling.LANCZOS)
    
    # Criar máscara circular
    mask = Image.new('L', (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0, size, size), fill=255)
    
    # Aplicar máscara
    output = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    output.paste(image, (0, 0))
    output.putalpha(mask)
    
    return output

# Gerar favicon em diferentes tamanhos
sizes = [16, 32, 48, 64, 128, 180, 192, 512]

# Criar favicon.ico com múltiplos tamanhos
ico_sizes = [(16, 16), (32, 32), (48, 48), (64, 64)]
ico_images = []
for size in [16, 32, 48, 64]:
    ico_images.append(create_circular_image(img, size))

# Salvar favicon.ico
ico_images[0].save(
    os.path.join(output_dir, "favicon.ico"),
    format='ICO',
    sizes=ico_sizes,
    append_images=ico_images[1:]
)
print("✓ favicon.ico criado")

# Salvar PNG para diferentes dispositivos
for size in [180, 192, 512]:
    circular_img = create_circular_image(img, size)
    filename = f"favicon-{size}x{size}.png"
    circular_img.save(os.path.join(output_dir, filename), format='PNG')
    print(f"✓ {filename} criado")

# Criar apple-touch-icon
apple_icon = create_circular_image(img, 180)
apple_icon.save(os.path.join(output_dir, "apple-touch-icon.png"), format='PNG')
print("✓ apple-touch-icon.png criado")

print("\n✅ Todos os favicons foram gerados com sucesso!")
