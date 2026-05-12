import { createAdminClient } from '@spree/admin-sdk'

const client = createAdminClient({
  baseUrl: 'https://your-store.com',
  secretKey: 'sk_xxx',
})

// region:example
const optionType = await client.optionTypes.create({
  name: 'color',
  presentation: 'Color',
  option_values: [
    { name: 'red', presentation: 'Red' },
    { name: 'navy', presentation: 'Navy' },
  ],
})
// endregion:example

export { optionType }
