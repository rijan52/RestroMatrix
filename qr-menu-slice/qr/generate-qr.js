import QRCode from "qrcode";
import { mkdir } from "fs/promises";
import { fileURLToPath } from "url";

const menuBaseUrl = process.env.MENU_URL || "https://your-frontend.vercel.app/menu";
const outputDir = new URL("./output/", import.meta.url);

await mkdir(fileURLToPath(outputDir), { recursive: true });

const singlePath = new URL("./output/qr-menu.png", import.meta.url);
await QRCode.toFile(fileURLToPath(singlePath), menuBaseUrl, {
    width: 512,
    margin: 1
});

const tables = [1, 2, 3, 4, 5];
for (const table of tables) {
    const tableUrl = `${menuBaseUrl}?table=${table}`;
    const tablePath = new URL(`./output/qr-table-${table}.png`, import.meta.url);
    await QRCode.toFile(fileURLToPath(tablePath), tableUrl, {
        width: 512,
        margin: 1
    });
}

console.log("QR codes generated in qr/output");
