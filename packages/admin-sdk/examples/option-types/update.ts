import { createAdminClient } from '@spree/admin-sdk'

const client = createAdminClient({
  baseUrl: 'https://your-store.com',
  secretKey: 'sk_xxx',
})

// region:example
const optionType = await client.optionTypes.update('ot_UkLWZg9DAJ', {
  presentation: 'Updated Presentation',
  option_values: [
    { name: 'red', presentation: 'Crimson' },
  ],
})
// endregion:example

export { optionType }
