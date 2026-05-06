import base64
import csv
import re
import shutil
import time
import unicodedata
from pathlib import Path

from openai import OpenAI


client = OpenAI()

INPUT_FOLDER = Path(r"C:\Users\pc\Downloads\Pinturas")
OUTPUT_FOLDER = Path(r"C:\Users\pc\Downloads\Pinturas")
MODEL = "gpt-5"
MAX_RETRIES = 3
SUPPORTED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}

PROMPT_BASE = """
Analiza esta pintura como si fueras director creativo de videos virales para arte.

Tu tarea es crear un guion breve, cinematografico y emocional, listo para editar en CapCut.

Objetivo:
- Convertir una sola pintura en un video corto muy atrapante.
- Mantener coherencia visual con la obra original.
- Hacer que cada escena se sienta como un acercamiento progresivo y dramatico.

Instrucciones:
1. Crea 6 a 8 escenas.
2. Incluye un gancho inicial fuerte que despierte curiosidad o emocion inmediata.
3. Cada escena debe tener:
   - Visual: descripcion breve y muy visual de lo que se ve
   - Texto: una frase emocional de maximo 12 palabras
   - Movimiento: un movimiento de camara simple y claro
4. El movimiento debe sentirse progresivo: inicio general, luego detalles, luego cierre emotivo.
5. Escribe en espanol claro, natural y listo para copiar.
6. Evita palabras tecnicas innecesarias.
7. No inventes elementos que contradigan claramente la imagen.
8. Prioriza un tono poetico, viral y evocador.

Reglas extra:
- El gancho debe ser corto e impactante.
- El texto de cada escena debe funcionar como texto sobre el video.
- Cada escena debe sonar distinta, no repetitiva.
- No agregues explicaciones fuera del formato.

Formato exacto:

[TITULO]
Texto:

[GANCHO]
Texto:

[ESCENA 1]
Visual:
Texto:
Movimiento:

[ESCENA 2]
Visual:
Texto:
Movimiento:

[ESCENA 3]
Visual:
Texto:
Movimiento:

[ESCENA 4]
Visual:
Texto:
Movimiento:

[ESCENA 5]
Visual:
Texto:
Movimiento:

[ESCENA 6]
Visual:
Texto:
Movimiento:

[ESCENA 7]
Visual:
Texto:
Movimiento:

[ESCENA 8]
Visual:
Texto:
Movimiento:

[CIERRE]
Texto:
"""


def slugify_filename(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    ascii_only = normalized.encode("ascii", "ignore").decode("ascii")
    cleaned = re.sub(r"[^A-Za-z0-9._-]+", "_", ascii_only)
    cleaned = re.sub(r"_+", "_", cleaned).strip("._")
    return cleaned or "salida"


def image_to_data_url(image_path: Path) -> str:
    mime_types = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
    }
    mime_type = mime_types.get(image_path.suffix.lower())
    if not mime_type:
        raise ValueError(f"Formato no soportado: {image_path.name}")

    with open(image_path, "rb") as image_file:
        encoded = base64.b64encode(image_file.read()).decode("utf-8")

    return f"data:{mime_type};base64,{encoded}"


def request_script(image_path: Path) -> str:
    image_data_url = image_to_data_url(image_path)

    response = client.responses.create(
        model=MODEL,
        input=[
            {
                "role": "user",
                "content": [
                    {"type": "input_text", "text": PROMPT_BASE},
                    {
                        "type": "input_image",
                        "image_url": image_data_url,
                        "detail": "high",
                    },
                ],
            }
        ],
    )

    return response.output_text.strip()


def extract_field(block: str, field_name: str) -> str:
    pattern = rf"{field_name}:\s*(.*?)(?=\n[A-ZÁÉÍÓÚÑa-záéíóúñ][^:\n]*:|\Z)"
    match = re.search(pattern, block, flags=re.DOTALL)
    if not match:
        return ""
    return " ".join(line.strip() for line in match.group(1).strip().splitlines()).strip()


def parse_script_sections(output_text: str) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    current_label = None
    current_lines: list[str] = []

    def flush_section() -> None:
        nonlocal current_label, current_lines
        if not current_label:
            return

        section_body = "\n".join(current_lines).strip()
        row = {
            "seccion": current_label,
            "visual": extract_field(section_body, "Visual"),
            "texto": extract_field(section_body, "Texto"),
            "movimiento": extract_field(section_body, "Movimiento"),
        }

        if not row["texto"] and section_body and current_label in {"TITULO", "GANCHO", "CIERRE"}:
            row["texto"] = section_body.replace("Texto:", "").strip()

        rows.append(row)
        current_label = None
        current_lines = []

    for line in output_text.splitlines():
        stripped = line.strip()
        section_match = re.match(r"^\[(.+?)\]\s*$", stripped)
        if section_match:
            flush_section()
            current_label = section_match.group(1).strip()
            continue

        if current_label:
            current_lines.append(line)

    flush_section()
    return rows


def save_output(image_path: Path, output_text: str) -> Path:
    safe_name = slugify_filename(image_path.stem)
    painting_folder = OUTPUT_FOLDER / safe_name
    painting_folder.mkdir(parents=True, exist_ok=True)
    output_file = painting_folder / f"{safe_name}_guion.txt"
    with open(output_file, "w", encoding="utf-8") as text_file:
        text_file.write(output_text)
    return output_file


def copy_original_image(image_path: Path) -> Path:
    safe_name = slugify_filename(image_path.stem)
    painting_folder = OUTPUT_FOLDER / safe_name
    painting_folder.mkdir(parents=True, exist_ok=True)
    copied_image = painting_folder / image_path.name
    shutil.copy2(image_path, copied_image)
    return copied_image


def save_readme(image_path: Path) -> Path:
    safe_name = slugify_filename(image_path.stem)
    painting_folder = OUTPUT_FOLDER / safe_name
    painting_folder.mkdir(parents=True, exist_ok=True)
    readme_file = painting_folder / "README.txt"

    readme_text = f"""Proyecto: {image_path.stem}

Archivos de esta carpeta:
- {image_path.name}: imagen original de la pintura
- {safe_name}_guion.txt: guion completo generado por IA
- {safe_name}_capcut.csv: escenas separadas para editar o revisar en tabla

Orden sugerido para crear el short en CapCut:
1. Abre la imagen original.
2. Usa el GANCHO como primer texto en pantalla.
3. Crea una escena por cada bloque ESCENA del CSV o del guion.
4. Aplica movimientos progresivos: plano general, acercamientos, detalles y cierre.
5. Termina con el CIERRE como ultimo texto emocional.

Consejo:
- Si una frase es muy larga para pantalla, acortala manteniendo la emocion.
"""

    with open(readme_file, "w", encoding="utf-8") as readme_handle:
        readme_handle.write(readme_text)

    return readme_file


def save_csv(image_path: Path, output_text: str) -> Path:
    safe_name = slugify_filename(image_path.stem)
    painting_folder = OUTPUT_FOLDER / safe_name
    painting_folder.mkdir(parents=True, exist_ok=True)
    csv_file = painting_folder / f"{safe_name}_capcut.csv"
    rows = parse_script_sections(output_text)

    with open(csv_file, "w", newline="", encoding="utf-8-sig") as csv_handle:
        writer = csv.DictWriter(
            csv_handle,
            fieldnames=["imagen", "seccion", "visual", "texto", "movimiento"],
        )
        writer.writeheader()

        for row in rows:
            writer.writerow(
                {
                    "imagen": image_path.name,
                    "seccion": row["seccion"],
                    "visual": row["visual"],
                    "texto": row["texto"],
                    "movimiento": row["movimiento"],
                }
            )

    return csv_file


def main() -> None:
    OUTPUT_FOLDER.mkdir(parents=True, exist_ok=True)

    if not INPUT_FOLDER.exists():
        raise FileNotFoundError(f"No existe la carpeta de entrada: {INPUT_FOLDER}")

    image_files = sorted(
        path for path in INPUT_FOLDER.iterdir() if path.suffix.lower() in SUPPORTED_EXTENSIONS
    )

    if not image_files:
        print("No se encontraron imagenes compatibles en la carpeta.")
        return

    success_count = 0

    for image_path in image_files:
        print(f"Procesando: {image_path.name}")

        for attempt in range(1, MAX_RETRIES + 1):
            try:
                output_text = request_script(image_path)
                copied_image = copy_original_image(image_path)
                output_file = save_output(image_path, output_text)
                csv_file = save_csv(image_path, output_text)
                readme_file = save_readme(image_path)
                success_count += 1
                print(f"Imagen: {copied_image.name}")
                print(f"OK: {output_file.name}")
                print(f"CSV: {csv_file.name}")
                print(f"README: {readme_file.name}")
                break
            except Exception as error:
                print(f"Intento {attempt}/{MAX_RETRIES} fallo con {image_path.name}: {error}")
                if attempt == MAX_RETRIES:
                    print(f"Se omite {image_path.name} tras varios intentos.")
                else:
                    time.sleep(2 * attempt)

    print(f"Proceso completado. Guiones generados: {success_count}/{len(image_files)}")


if __name__ == "__main__":
    main()
