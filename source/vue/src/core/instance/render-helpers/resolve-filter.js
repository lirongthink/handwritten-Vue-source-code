import { resolveAsset } from "../../utils/options";
import { identity } from "../../../shared/util";

export function resolveFilter (id) {
  return resolveAsset(this.$options, 'filters', id, true) || identity
}
