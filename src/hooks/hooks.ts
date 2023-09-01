import { BeforeAll, AfterAll, Before, After, Status, AfterStep } from "@cucumber/cucumber";
import { chromium, Browser, Page, BrowserContext } from "@playwright/test";
import { pageFixture } from "./pageFixture";
import { getEnv } from "../helper/env/env";
import { invokeBrowser } from "../helper/browsers/browserManager";
import { createLogger } from "winston";
import { options } from "../util/logger";

let browser: Browser;
let context: BrowserContext;

BeforeAll(async () => {
    getEnv();
    browser = await invokeBrowser();
    // browser = await chromium.launch({ headless: false });
})

Before(async function ({pickle}) {
    const scenarioName = pickle.name+pickle.id;
    context = await browser.newContext();
    const page = await browser.newPage();
    pageFixture.page = page;
    pageFixture.logger = createLogger(options(scenarioName));
});

/* AfterStep(async function ({ pickle, result }) {
    const img = await pageFixture.page.screenshot({ path: `./test-results/screenshots/${pickle.name}.png`, type: "png" })
    await this.attach(img, "image/png");
}); */

After(async function ({ pickle, result }) {
    console.log(result?.status);

    if (result?.status == Status.FAILED) {
        const img = await pageFixture.page.screenshot({ path: `./test-results/screenshots/${pickle.name}.png`, type: "png" })
        await this.attach(img, "image/png");

        //attach video
        const video = await pageFixture.page.video();
        const videoPath = `./test-results/videos/${pickle.name}.webm`;
        await video.saveAs(videoPath);
        await this.attach(videoPath, "video/webm");
    }

    await pageFixture.page.close();
    await context.close();
});

AfterAll(async () => {
    await browser.close();
    pageFixture.logger.close();
})
