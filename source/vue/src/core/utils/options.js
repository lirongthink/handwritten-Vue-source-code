import { camelize, hasOwn } from "../../shared/util";

export function resolveAsset(options, type, id) {
  if (typeof id !== 'string') {
    return
  }
  const assets = options[type]
  if (hasOwn(assets, id)) return assets[id]
  const camelizedId = camelize(id)
  if (hasOwn(assets, camelizedId)) return assets[camelizedId]
  const PasccalCaseId = capitalize(camelizedId)
  if (hasOwn(assets, PasccalCaseId)) return assets[PasccalCaseId]

  const res = assets[id] || assets[camelizedId] || assets[PasccalCaseId]
  return res
}
