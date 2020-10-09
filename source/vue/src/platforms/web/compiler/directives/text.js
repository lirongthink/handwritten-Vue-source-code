import { addProp } from "../../../../compiler/helpers";

/* @flow */

export default function text (el, dir) {
  if (dir.value) {
    addProp(el, 'textContent', `_s(${dir.value})`, dir)
  }
}
