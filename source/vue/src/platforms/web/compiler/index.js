import modules from './modules/index'
import directives from './directives/index'
import { genStaticKeys, makeMap } from "../../../shared/util";
import { isPreTag, isReservedTag } from "../util/element";
import { createCompiler } from '../../../compiler';

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
  preserveWhitespace: false,
  isPreTag,
  directives,
  isUnaryTag,
  isReservedTag
}

const { compile, compileToFunctions } = createCompiler(baseOptions)

export { compile, compileToFunctions }
