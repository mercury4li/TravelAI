import { createApp } from "./app.js";
import { getConfig } from "./config.js";

const config = getConfig();
const app = createApp();

app.listen(config.port, () => {
  console.log(`TravelAI backend listening on http://localhost:${config.port}`);
});
