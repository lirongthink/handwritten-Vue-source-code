import { addProp } from "../../../../compiler/helpers";

/* @flow */


export default function html (el, dir) {
  if (dir.value) {
    addProp(el, 'innerHTML', `_s(${dir.value})`, dir)
  }
}
