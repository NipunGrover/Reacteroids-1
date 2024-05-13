
import { Schema, Context, type } from "@colyseus/schema";

export class GameState extends Schema {
  
static MAX_SIZE: number = 80;



  @type(XY) position: XY;
  @type(XY) speed:XY;

  @type("string") mySynchronizedProperty: string = "Hello world";

}
