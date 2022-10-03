/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect, useState} from 'react'
import {FormattedMessage} from 'react-intl'
import {
    Alert,
    AlertIcon,
    Box,
    Button,
    Container,
    Grid,
    GridItem,
    Stack,
    Input
} from '@chakra-ui/react'
import useNavigation from '../../hooks/use-navigation'
import {CheckoutProvider, useCheckout} from './util/checkout-context'
import ContactInfo from './partials/contact-info'
import ShippingAddress from './partials/shipping-address'
import ShippingOptions from './partials/shipping-options'
import useCustomer from '../../commerce-api/hooks/useCustomer'
import useBasket from '../../commerce-api/hooks/useBasket'
import Payment from './partials/payment'
import CheckoutSkeleton from './partials/checkout-skeleton'
import OrderSummary from '../../components/order-summary'
import {Buffer} from 'buffer'

const Checkout = () => {
    var captureUrlFinal = 'default value'
    const navigate = useNavigation()
    const {globalError, step, placeOrder} = useCheckout()
    const [isLoading, setIsLoading] = useState(false)

    // Scroll to the top when we get a global error
    useEffect(() => {
        if (globalError || step === 4) {
            window.scrollTo({top: 0})
        }
    }, [globalError, step])

    //This function is for getting the capture URL from its child component
    const [value, setValue] = React.useState(null)
    const pull_data2 = (data) => {
        setValue(data)
        captureUrlFinal = data
        console.log('capture Url------------------------------->' + captureUrlFinal)
    }

    const customCheckout = async () => {
        let endpoint
        const urlParams = new URLSearchParams(window.location.href)
        const paymentStatus = urlParams.get('status')
        const pId = urlParams.get('PayerID')
        localStorage.setItem('isEditPayment', false)
        if (paymentStatus === 'approved') {
            var urlencoded = new URLSearchParams()
            urlencoded.append(
                'grant_type',
                'urn:demandware:params:oauth:grant-type:client-id:dwsid:dwsecuretoken'
            )
            const res4 = await fetch(
                `http://localhost:3000/mobify/proxy/ocapi/dw/oauth2/access_token?client_id=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`,
                {
                    method: 'POST',
                    headers: {
                        Authorization:
                            //encoded base64 username:password:client_id
                            'Basic bml0aXNoQGN5bnRleGEuY29tOmNvbW1lcmNlMTIzNDU6YWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFh'
                    },
                    body: urlencoded
                }
            )
            if (res4.ok) {
                var result = await res4.json()
                var accessToken = result.access_token
                console.log('access token =' + accessToken)
                const res1 = await fetch(
                    `http://localhost:3000/mobify/proxy/ocapi/s/-/dw/data/v22_6/sites/RefArch/site_preferences/preference_groups/paypalTokens/sandbox`,
                    {method: 'GET', headers: {Authorization: 'Bearer ' + accessToken}}
                )
                if (res1.ok) {
                    console.log('after json222--------------------------------------------------')
                    var result2 = await res1.json()
                    console.log('Capture URL 11 ------------------------------')
                    console.log(result2.c_captureURL)
                    endpoint = result2.c_captureURL
                }
            }

            // let captureUrl = localStorage.getItem('captureUrl')
            var base64encodedKey = Buffer.from(
                'AX1waZtfBYnJ7BPQwaB-P4VAyn8aQ7EENsCOapxLQCwadDgdRWgIXCrIa79AUTmRrcYgy4gCJq7cyrm7:EN-5j5ggzL6-yodQfcD2FrvLtOExeQ_hEVMAX9bb4ZeTHhBUv7x92HZsBSEQ93kLOIWBmJWX4jsYc2kI'
            ).toString('Base64')
            var myHeaders = new Headers()
            myHeaders.append('Content-Type', 'application/json')
            myHeaders.append('Authorization', 'Basic ' + base64encodedKey)
            var raw = JSON.stringify({
                PayerID: pId
            })
            var requestOptions = {
                method: 'POST',
                headers: myHeaders,
                body: raw,
                redirect: 'follow'
            }
            console.log('endpoint is---------------------------')
            console.log(endpoint)
            const res = await fetch(endpoint, requestOptions)
            if (res.ok) {
                console.log('Payment is captured')
            }
        }
    }

    // const handleChange = (event) => {
    //     if (event.target.value != null || event.target.value != '') {
    //         setValue(event.target.value)
    //     }
    // }

    const submitOrder = async () => {
        setIsLoading(true)
        try {
            await customCheckout()
            await placeOrder()
            navigate('/checkout/confirmation')
        } catch (error) {
            setIsLoading(false)
        }
    }

    return (
        <Box background="gray.50" flex="1">
            <Container
                data-testid="sf-checkout-container"
                maxWidth="container.xl"
                py={{base: 7, lg: 16}}
                px={{base: 0, lg: 8}}
            >
                <Grid templateColumns={{base: '1fr', lg: '66% 1fr'}} gap={{base: 10, xl: 20}}>
                    <GridItem>
                        <Stack spacing={4}>
                            {globalError && (
                                <Alert status="error" variant="left-accent">
                                    <AlertIcon />
                                    {globalError}
                                </Alert>
                            )}

                            <ContactInfo />
                            <ShippingAddress />
                            <ShippingOptions />
                            <Payment func2={pull_data2} />

                            {step === 4 && (
                                <Box pt={3} display={{base: 'none', lg: 'block'}}>
                                    <Container variant="form">
                                        <Button
                                            w="full"
                                            onClick={submitOrder}
                                            isLoading={isLoading}
                                            data-testid="sf-checkout-place-order-btn"
                                        >
                                            <FormattedMessage
                                                defaultMessage="Place Order"
                                                id="checkout.button.place_order"
                                            />
                                        </Button>
                                    </Container>
                                </Box>
                            )}
                        </Stack>
                    </GridItem>

                    <GridItem py={6} px={[4, 4, 4, 0]}>
                        <OrderSummary showTaxEstimationForm={false} showCartItems={true} />

                        {step === 4 && (
                            <Box display={{base: 'none', lg: 'block'}} pt={2}>
                                <Button w="full" onClick={submitOrder} isLoading={isLoading}>
                                    <FormattedMessage
                                        defaultMessage="Place Order"
                                        id="checkout.button.place_order"
                                    />
                                </Button>
                            </Box>
                        )}
                    </GridItem>
                </Grid>
            </Container>

            {step === 4 && (
                <Box
                    display={{lg: 'none'}}
                    position="sticky"
                    bottom="0"
                    px={4}
                    pt={6}
                    pb={11}
                    background="white"
                    borderTop="1px solid"
                    borderColor="gray.100"
                >
                    <Container variant="form">
                        <div className="placeOrderDiv"></div>
                        <Button w="full" onClick={submitOrder} isLoading={isLoading}>
                            <FormattedMessage
                                defaultMessage="Place Order"
                                id="checkout.button.place_order"
                            />
                        </Button>
                    </Container>
                    {/* <Input value={value} placeholder="Here is a sample placeholder" size="sm" /> */}
                </Box>
            )}
        </Box>
    )
}

const CheckoutContainer = () => {
    const customer = useCustomer()
    const basket = useBasket()

    if (!customer || !customer.customerId || !basket || !basket.basketId) {
        return <CheckoutSkeleton />
    }

    return (
        <CheckoutProvider>
            <Checkout />
        </CheckoutProvider>
    )
}

export default CheckoutContainer
