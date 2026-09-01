import { Engine } from "@framekore/core";
import { Cena } from "./Scenes/Cena";

const engine = new Engine()
// engine.use() //para usar plugins

engine.setScene(new Cena())
engine.start()