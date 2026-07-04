import { Font } from "@react-pdf/renderer";

let fontsRegistered = false;

export function registerReportFonts() {
  if (fontsRegistered) return;
  fontsRegistered = true;

  Font.register({
    family: "Roboto",
    fonts: [
      {
        src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf",
        fontWeight: 400,
      },
      {
        src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-medium-webfont.ttf",
        fontWeight: 700,
      },
    ],
  });
}
