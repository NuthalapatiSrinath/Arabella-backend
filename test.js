import sendEmail from "./src/utils/email.js";
import { forgotPasswordEmail } from "./src/utils/forgotPasswordMailPage.js";

const token = "dgjbhefjkdxfndsklfvdor";

sendEmail({
  to: "srynath13@gmail.com",
  subject: "Hello World",
  text: "This is body",
  html: forgotPasswordEmail(
    `https://muralikrishna.dev/forgotPassword/?token=${token}`,
    "Srinath"
  ),
});
