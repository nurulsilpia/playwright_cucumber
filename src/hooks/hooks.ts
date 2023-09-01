import { BeforeAll, AfterAll, Before, After, Status, AfterStep } from "@cucumber/cucumber";
import { chromium, Browser, Page, BrowserContext } from "@playwright/test";
import { pageFixture } from "./pageFixture";
import { getEnv } from "../helper/env/env";
import { invokeBrowser } from "../helper/browsers/browserManager";
import { createLogger } from "winston";
import { options } from "../util/logger";
const fs = require("fs-extra");

let browser: Browser;
let context: BrowserContext;

BeforeAll(async () => {
    getEnv();
    browser = await invokeBrowser();
    // browser = await chromium.launch({ headless: false });
})

Before(async function ({pickle}) {
    const scenarioName = pickle.name+pickle.id;
    context = await browser.newContext({
        recordVideo: {
            dir: "test-results/videos",
        }
    });
    const page = await browser.newPage();
    pageFixture.page = page;
    pageFixture.logger = createLogger(options(scenarioName));
});

/* AfterStep(async function ({ pickle, result }) {
    const img = await pageFixture.page.screenshot({ path: `./test-results/screenshots/${pickle.name}.png`, type: "png" })
    await this.attach(img, "image/png");
}); */

After(async function ({ pickle, result }) {
    let videoPath: string;
    let img: Buffer;
    if (result?.status == Status.FAILED) {
        img = await pageFixture.page.screenshot({ path: `./test-results/screenshots/${pickle.name}.png`, type: "png" })
        videoPath = await pageFixture.page.video().path();
    }
    await pageFixture.page.close();
    await context.close();
    if (result?.status == Status.FAILED) {
        await this.attach(
            img, "image/png"
        );
        await this.attach(
            fs.readFileSync(videoPath),
            'video/webm'
        );
    }

});

AfterAll(async () => {
    await browser.close();
    // pageFixture.logger.close();
})
