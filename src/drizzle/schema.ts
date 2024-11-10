import { subscriptionTiers, TierNames } from '@/lib/data/subscription-tiers'
import { relations } from 'drizzle-orm'
import {
    pgTable,
    uuid,
    text,
    timestamp,
    index,
    boolean,
    real,
    primaryKey,
    pgEnum,
} from 'drizzle-orm/pg-core'

// timezone는 시간대를 포함하여 저장함. 이는 타임스탬프를 저장할 떄 해당 시간대 정보도 함께 저장하여, db에서 시간대를 자동으로 관리할 수 있도록 함
// 이를 통해 다른 시간대의 사용자나 시스템에서 조회할 떄 자동으로 현지 시간대로 변환하여 보여줄 수 있음
const createdAt = timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow()
const updatedAt = timestamp('updated_at', { withTimezone: true })
    .notNull()
    .$onUpdate(() => new Date())

export const ProductTable = pgTable(
    'products',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        clerkUserId: text('clerk_user_id').notNull(),
        name: text('name').notNull(),
        url: text('url').notNull(),
        description: text('description'),
        createdAt,
        updatedAt,
    },

    // clerkUserId 필드에 인덱스를 추가. 이 인덱스를 통해 clerkUserId로 검색할 떄 db의 검색 속도를 높일 수 있음
    (table) => {
        return {
            clerkUserIdIndex: index('products.clerk_user_id_index').on(
                table.clerkUserId,
            ),
        }
    },
)

export const productRelation = relations(ProductTable, ({ one, many }) => {
    return {
        productCustomization: one(ProductCustomizationTable),
        productViews: many(ProductViewTable),
        countryGroupDiscounts: many(CountryGroupDiscountTable),
    }
})

export const ProductCustomizationTable = pgTable('product_customizations', {
    id: uuid('id').primaryKey().defaultRandom(),
    classPrefix: text('class_prefix'),

    // product_id 필드는 products 테이블의 id 필드를 참조하고 있음, onDelete: 'cascade' 옵션을 통해 products 테이블의 레코드가 삭제되면 product_customizations 테이블의 레코드도 삭제되도록 설정
    productId: uuid('product_id')
        .notNull()
        .references(() => ProductTable.id, { onDelete: 'cascade' })
        .unique(),
    locationMessage: text('location_message')
        .notNull()
        .default(
            'Hey! It looks like you are from <b>{country}</b>. We support Parity Purchasing Power, so if you need it, use code <b>“{coupon}”</b> to get <b>{discount}%</b> off.',
        ),
    backgroundColor: text('background_color')
        .notNull()
        .default('hsl(193, 82%, 31%)'),
    textColor: text('text_color').notNull().default('hsl(0, 0%, 100%)'),
    fontSize: text('font_size').notNull().default('1rem'),
    bannerContainer: text('banner_container').notNull().default('body'),
    isSticky: boolean('is_sticky').notNull().default(true),
    createdAt,
    updatedAt,
})

export const productCustomizationRelation = relations(
    ProductCustomizationTable,
    ({ one }) => {
        return {
            product: one(ProductTable, {
                fields: [ProductCustomizationTable.productId],
                references: [ProductTable.id],
            }),
        }
    },
)

export const ProductViewTable = pgTable('product_views', {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id')
        .notNull()
        .references(() => ProductTable.id, { onDelete: 'cascade' }),
    countryId: uuid('country_id').references(() => CountryTable.id, {
        onDelete: 'cascade',
    }),
    visitedAt: timestamp('visited_at', { withTimezone: true })
        .notNull()
        .defaultNow(),
})

export const productViewRelations = relations(ProductViewTable, ({ one }) => {
    return {
        product: one(ProductTable, {
            fields: [ProductViewTable.productId],
            references: [ProductTable.id],
        }),
        country: one(CountryTable, {
            fields: [ProductViewTable.countryId],
            references: [CountryTable.id],
        }),
    }
})

export const CountryTable = pgTable('countries', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull().unique(),
    code: text('code').notNull().unique(),
    countryGroupId: uuid('country_group_id')
        .notNull()
        .references(() => CountryGroupTable.id, { onDelete: 'cascade' }),
    createdAt,
    updatedAt,
})

export const countryRelation = relations(CountryTable, ({ one, many }) => {
    return {
        countryGroup: one(CountryGroupTable, {
            fields: [CountryTable.countryGroupId],
            references: [CountryGroupTable.id],
        }),
        productViews: many(ProductViewTable),
    }
})

export const CountryGroupTable = pgTable('country_groups', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull().unique(),
    recommendedDiscountPercentage: real(
        'recommended_discount_percentage',
    ).notNull(),
    createdAt,
    updatedAt,
})

export const countryGroupRelation = relations(CountryGroupTable, ({ many }) => {
    return {
        countries: many(CountryTable),
        countryGroupDiscounts: many(CountryGroupDiscountTable),
    }
})

export const CountryGroupDiscountTable = pgTable(
    'country_group_discounts',
    {
        countryGroupId: uuid('country_group_id')
            .notNull()
            .references(() => CountryGroupTable.id, { onDelete: 'cascade' }),
        productId: uuid('product_id')
            .notNull()
            .references(() => ProductTable.id, { onDelete: 'cascade' }),
        coupon: text('coupon').notNull(),
        discountPercentage: real('discount_percentage').notNull(),
        createdAt,
        updatedAt,
    },
    (table) => {
        return {
            pk: primaryKey({
                columns: [table.countryGroupId, table.productId],
            }),
        }
    },
)

export const countryGroupDiscountRelation = relations(
    CountryGroupDiscountTable,
    ({ one }) => {
        return {
            countryGroup: one(CountryGroupTable, {
                fields: [CountryGroupDiscountTable.countryGroupId],
                references: [CountryGroupTable.id],
            }),
            product: one(ProductTable, {
                fields: [CountryGroupDiscountTable.productId],
                references: [ProductTable.id],
            }),
        }
    },
)

export const TierEnum = pgEnum(
    'tier',
    Object.keys(subscriptionTiers) as [TierNames],
)

export const UserSubscriptionTable = pgTable(
    'user_subscriptions',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        clerkUserId: text('clerk_user_id').notNull().unique(),
        stripeSubscriptionItemId: text('stripe_subscription_item_id'),
        stripeSubscriptionId: text('stripe_subscription_id'),
        stripeCustomerId: text('stripe_customer_id'),
        tier: TierEnum('tier').notNull(),
        createdAt,
        updatedAt,
    },
    (table) => {
        return {
            clerkUserIndex: index('user_subscriptions.clerk_user_id_index').on(
                table.clerkUserId,
            ),
            stripeCustomerIdIndex: index(
                'user_subscriptions.stripe_customer_id_index',
            ).on(table.stripeCustomerId),
        }
    },
)
