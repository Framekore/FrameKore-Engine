import * as intro from "@clack/prompts";
import color from "picocolors";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const AVAILABLE_PACKAGES: Record<string, { name: string; version: string; description: string }> = {
    "asset-manager": {
        name: "@framekore/asset-manager",
        version: "^0.0.10",
        description: "Carregamento e gestão de assets",
    },
    "input-manager": {
        name: "@framekore/input-manager",
        version: "^0.0.10",
        description: "Mapeamento e escuta de inputs",
    },
    "math": {
        name: "@framekore/math",
        version: "^0.0.9",
        description: "Utilitários matemáticos e vetores",
    },
    "physics2d": {
        name: "@framekore/physics2d",
        version: "^0.0.10",
        description: "Motor de física 2D",
    },
    "render2d": {
        name: "@framekore/render2d",
        version: "^0.0.10",
        description: "Sistemas de renderização 2D",
    },
    "transform2d": {
        name: "@framekore/transform2d",
        version: "^0.0.10",
        description: "Hierarquia de transformações e posições",
    },
};

async function main() {
    console.clear();

    intro.intro(`${color.bgCyan(color.black(" FRAMEKORE ENGINE "))} ${color.dim("v0.1.0")}`);

    const project = await intro.group(
        {
            projectName: () =>
                intro.text({
                    message: "Qual o nome do seu projeto?",
                    placeholder: "my-framekore-game",
                    defaultValue: "my-framekore-game",
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
            packages: ({ results }) => {
                const isMinimalTemplate =
                    results.template === "template-js" || results.template === "template-ts";

                if (!isMinimalTemplate) return Promise.resolve([]);

                return intro.multiselect({
                    message: "Selecione os pacotes adicionais do FrameKore:",
                    options: Object.entries(AVAILABLE_PACKAGES).map(([key, pkg]) => ({
                        value: key,
                        label: pkg.name,
                        hint: pkg.description,
                    })),
                    required: false,
                });
            },
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

        pkg.dependencies = pkg.dependencies || {};

        // Garante a presença do pacote core
        pkg.dependencies["@framekore/core"] = "^0.0.10";

        // Injeta os pacotes selecionados
        if (Array.isArray(project.packages)) {
            for (const pkgKey of project.packages) {
                const selected = AVAILABLE_PACKAGES[pkgKey];
                if (selected) {
                    pkg.dependencies[selected.name] = selected.version;
                }
            }
        }

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