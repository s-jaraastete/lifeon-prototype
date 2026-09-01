export const serverActionHandler = async <OtherPayload>(
  action: (other: OtherPayload, state: Awaited<FormActionState> | null, payload: FormData) => FormActionState | Promise<FormActionState>,
  other: OtherPayload,
  state: Awaited<FormActionState> | null,
  formData: FormData,
): Promise<FormActionState> => {
  return await action(other, state, formData)
}
