import * as intro from "@clack/prompts";
import color from "picocolors";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
    console.clear();

    intro.intro(`${color.bgCyan(color.black(" FRAMEKORE ENGINE "))} ${color.dim("v0.1.0")}`);

    const project = await intro.group(
        {
            projectName: () =>
                intro.text({
                    message: "Qual o nome do seu projeto?",
                    placeholder: "my-framekore-game",
                    defaultValue: "my-framekore-game"
                }),
            template: () =>
                intro.select({
                    message: "Selecione um template:",
                    options: [
                        { value: "template-js", label: "JavaScript (Vite + Core)" },
                        { value: "template-ts", label: "TypeScript (Vite + Core)" },
                        { value: "template-basic-js", label: "JavaScript (Vite + BasicKit)" },
                        { value: "template-basic-ts", label: "TypeScript (Vite + BasicKit)" },
                    ],
                }),
        },
        {
            onCancel: () => {
                intro.cancel("Criação do projeto cancelada.");
                process.exit(0);
            },
        }
    );

    const targetDir = path.resolve(process.cwd(), project.projectName);
    const templateDir = path.resolve(__dirname, "templates", project.template);

    if (fs.existsSync(targetDir)) {
        intro.cancel(`A pasta "${project.projectName}" já existe!`);
        process.exit(1);
    }

    const spinner = intro.spinner();
    spinner.start("Copiando arquivos do template...");

    // Copia os arquivos do template para a pasta destino
    copyDir(templateDir, targetDir);

    // Atualiza o package.json do novo projeto
    const pkgPath = path.join(targetDir, "package.json");
    if (fs.existsSync(pkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
        pkg.name = project.projectName;
        fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
    }

    spinner.stop("Template clonado com sucesso!");

    intro.outro(`Projeto ${color.green(project.projectName)} criado com sucesso!

${color.bold("Próximos passos:")}
  ${color.cyan(`cd ${project.projectName}`)}
  ${color.cyan("pnpm install")}
  ${color.cyan("pnpm dev")}
`);
}

function copyDir(src: string, dest: string) {
    fs.mkdirSync(dest, { recursive: true });
    for (const file of fs.readdirSync(src)) {
        const srcFile = path.resolve(src, file);
        const destFile = path.resolve(dest, file === "_gitignore" ? ".gitignore" : file);

        if (fs.statSync(srcFile).isDirectory()) {
            copyDir(srcFile, destFile);
        } else {
            fs.copyFileSync(srcFile, destFile);
        }
    }
}

main().catch(console.error);