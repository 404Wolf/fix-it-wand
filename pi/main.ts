import { Recorder } from "./Recorder.ts";
import { delay } from "jsr:@std/async";

const recorder = new Recorder("test.wav");
recorder.start();
await delay(5000);
await recorder.finish();
