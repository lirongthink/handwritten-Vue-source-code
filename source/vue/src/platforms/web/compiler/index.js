import { baseCompile } from "../../../compiler";
import modules from './modules/index'
import { genStaticKeys, makeMap } from "../../../shared/util";
import { isPreTag, isReservedTag } from "../util/element";
import { createCompileToFunctionFn } from "../../../compiler/to-function";

export const isNonPhrasingTag = makeMap(
  'address,article,aside,base,blockquote,body,caption,col,colgroup,dd,' +
  'details,dialog,div,dl,dt,fieldset,figcaption,figure,footer,form,' +
  'h1,h2,h3,h4,h5,h6,head,header,hgroup,hr,html,legend,li,menuitem,meta,' +
  'optgroup,option,param,rp,rt,source,style,summary,tbody,td,tfoot,th,thead,' +
  'title,tr,track'
);
const isUnaryTag = makeMap(
  'area,base,br,col,embed,frame,hr,img,input,isindex,keygen,' +
  'link,meta,param,source,track,wbr'
)
const baseOptions = {
  staticKeys: genStaticKeys(modules),
  modules,
  expectHTML: true,
  isPreTag,
  isUnaryTag,
  isReservedTag
}

export function compile (template, baseOptions){
  const compiled = baseCompile(template.trim(), baseOptions)
  return compiled
}
export const compileToFunctions = createCompileToFunctionFn(compile)
