import {
    CountryGroupDiscountTable,
    CountryGroupTable,
    CountryTable,
    ProductCustomizationTable,
    ProductTable,
    ProductViewTable,
    UserSubscriptionTable,
} from '../schema'

type Product = typeof ProductTable.$inferSelect
type ProductCustomization = typeof ProductCustomizationTable.$inferSelect
type ProductView = typeof ProductViewTable.$inferSelect

type Country = typeof CountryTable.$inferSelect
type CountryGroup = typeof CountryGroupTable.$inferSelect
type CountryGroupDiscount = typeof CountryGroupDiscountTable.$inferSelect

type UserSubscription = typeof UserSubscriptionTable.$inferSelect
