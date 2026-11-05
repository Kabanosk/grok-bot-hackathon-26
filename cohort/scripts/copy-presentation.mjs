import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const repository = fileURLToPath(new URL("../../", import.meta.url));
const source = resolve(repository, "docs/presentation/cohort");
const destination = fileURLToPath(
  new URL("../dist/presentation/", import.meta.url),
);
const files = [
  "cohort-pmf-deck.pdf",
  "cohort-pmf-45s.mp4",
  "assets/film-intro.png",
  "assets/geist-latin-wght-normal.woff2",
];

for (const file of files) {
  const target = resolve(destination, file);
  await mkdir(dirname(target), { recursive: true });
  await copyFile(resolve(source, file), target);
}
const page = (await readFile(resolve(source, "index.html"), "utf8"))
  .replace('href="demo-film.html"', 'href="/workspace"')
  .replace("Explore the mockup", "Open workspace")
  .replace('href="demo/"', 'href="/#panel"')
  .replace("Open prototype", "Open market panel")
  .replace(
    'href="validation.txt"',
    'href="https://github.com/Kabanosk/grok-bot-hackathon-26/blob/main/cohort/README.md"',
  )
  .replace("Verification notes", "Project documentation");
await writeFile(resolve(destination, "index.html"), page);
console.log("Packaged presentation page, PDF, MP4, and poster.");
