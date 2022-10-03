/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useState} from 'react'
import {FormattedMessage, FormattedNumber, useIntl} from 'react-intl'
import PropTypes from 'prop-types'
import {
    Box,
    Button,
    Container,
    Flex,
    Heading,
    Radio,
    RadioGroup,
    Stack,
    Text,
    Tooltip
} from '@chakra-ui/react'
import {useForm, Controller} from 'react-hook-form'
import {LockIcon, PaypalIcon} from '../../../components/icons'
import {useCheckout} from '../util/checkout-context'
import CreditCardFields from '../../../components/forms/credit-card-fields'
import CCRadioGroup from './cc-radio-group'
import {Buffer} from 'buffer'
// import fetch from 'cross-fetch'

const PaymentSelection = ({form, func3, hideSubmitButton, onSubmit = () => null}) => {
    const [value1, setValue1] = React.useState('paypal')
    const {formatMessage} = useIntl()
    const {customer, basket} = useCheckout()

    const hasSavedCards = customer?.paymentInstruments?.length > 0

    const [isEditingPayment, setIsEditingPayment] = useState(!hasSavedCards)

    form = form || useForm()

    const submitForm = async (payment) => {
        await onSubmit(payment)
    }

    // Acts as our `onChange` handler for paymentInstrumentId radio group. We do this
    // manually here so we can toggle off the 'add payment' form as needed.
    const onPaymentIdChange = (value) => {
        if (value && isEditingPayment) {
            togglePaymentEdit()
        }
        form.reset({paymentInstrumentId: value})
    }

    // Opens/closes the 'add payment' form. Notice that when toggling either state,
    // we reset the form so as to remove any payment selection.
    const togglePaymentEdit = () => {
        form.reset({paymentInstrumentId: ''})
        setIsEditingPayment(!isEditingPayment)
        form.trigger()
    }

    const [value, setValue] = React.useState('cc')
    var showCreditCard = true
    var dontshowCreditCard = false
    var captureUrl
    const handleSelection = async (e) => {
        console.log(e + 'payment method selected')
        if (e === 'paypal') {
            setValue('paypal')
            var orderTotal = basket.orderTotal
            console.log('orderTotal:' + orderTotal)

            var myHeaders = new Headers()
            var base64encodedKey = Buffer.from(
                'AX1waZtfBYnJ7BPQwaB-P4VAyn8aQ7EENsCOapxLQCwadDgdRWgIXCrIa79AUTmRrcYgy4gCJq7cyrm7:EN-5j5ggzL6-yodQfcD2FrvLtOExeQ_hEVMAX9bb4ZeTHhBUv7x92HZsBSEQ93kLOIWBmJWX4jsYc2kI'
            ).toString('Base64')
            myHeaders.append('Content-Type', 'application/json')
            myHeaders.append('Prefer', 'return=representation')
            myHeaders.append(
                'Authorization',
                // base64 encode of clientid:clientsecret
                'Basic ' + base64encodedKey
            )
            console.log(basket)
            var raw = JSON.stringify({
                intent: 'CAPTURE',
                purchase_units: [
                    {
                        amount: {
                            currency_code: 'USD',
                            value: orderTotal,
                            breakdown: {
                                item_total: {
                                    currency_code: 'USD',
                                    value: orderTotal
                                }
                            }
                        }
                    }
                ],
                application_context: {
                    return_url: 'http://localhost:3000/checkout?url=return&status=approved',
                    cancel_url: 'http://localhost:3000/checkout?url=cancel&status=notApproved'
                }
            })
            var requestOptions = {
                method: 'POST',
                headers: myHeaders,
                body: raw
                // redirect: 'follow'
            }
            const res = await fetch(
                'https://api-m.sandbox.paypal.com/v2/checkout/orders',
                requestOptions
            )
            if (res.ok) {
                var result = await res.json()
                captureUrl = result.links[3].href
                var urlencoded = new URLSearchParams()
                urlencoded.append(
                    'grant_type',
                    'urn:demandware:params:oauth:grant-type:client-id:dwsid:dwsecuretoken'
                )
                const res2 = await fetch(
                    `http://localhost:3000/mobify/proxy/ocapi/dw/oauth2/access_token?client_id=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`,
                    {
                        method: 'POST',
                        headers: {
                            Authorization:
                                'Basic bml0aXNoQGN5bnRleGEuY29tOmNvbW1lcmNlMTIzNDU6YWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFh'
                        },
                        body: urlencoded
                    }
                )
                if (res2.ok) {
                    console.log('access token successfull------------------')
                    var response = await res2.json()
                    var accessToken = response.access_token
                    console.log('access Token ==' + accessToken)

                    var headers = {}
                    headers['Authorization'] = 'Bearer ' + accessToken
                    headers['Content-Type'] = 'application/json'
                    const res3 = await fetch(
                        `http://localhost:3000/mobify/proxy/ocapi/s/-/dw/data/v22_6/sites/RefArch/site_preferences/preference_groups/paypalTokens/sandbox`,
                        {
                            method: 'PATCH',
                            headers: headers,
                            body: JSON.stringify({c_captureURL: captureUrl})
                        }
                    )
                    if (res3.ok) {
                        console.log('Response Success')
                        var contentResult2 = await res3.json()
                        console.log(contentResult2)
                    }
                }
                // func3(captureUrl)
                // localStorage.setItem('captureUrl', captureUrl)
                localStorage.setItem('isEditPayment', 'null')
                var redirectURl = result.links[1].href
                window.location.assign(redirectURl)
            }
            localStorage.setItem('PaymentMethod', 'paypal')
        } else {
            setValue('cc')
            localStorage.setItem('PaymentMethod', 'cc')
        }

        // var myHeaders = new Headers()
        // var base64encodedKey = Buffer.from(
        //     'AX1waZtfBYnJ7BPQwaB-P4VAyn8aQ7EENsCOapxLQCwadDgdRWgIXCrIa79AUTmRrcYgy4gCJq7cyrm7:EN-5j5ggzL6-yodQfcD2FrvLtOExeQ_hEVMAX9bb4ZeTHhBUv7x92HZsBSEQ93kLOIWBmJWX4jsYc2kI'
        // ).toString('Base64')
        // myHeaders.append('Content-Type', 'application/json')
        // myHeaders.append('Prefer', 'return=representation')
        // myHeaders.append(
        //     'Authorization',
        //     // base64 encode of clientid:clientsecret
        //     'Basic ' + base64encodedKey
        // )
        // console.log('basket==>')
        // console.log(basket)
        // var raw = JSON.stringify({
        //     intent: 'CAPTURE',
        //     purchase_units: [
        //         {
        //             amount: {
        //                 currency_code: 'USD',
        //                 value: orderTotal,
        //                 breakdown: {
        //                     item_total: {
        //                         currency_code: 'USD',
        //                         value: orderTotal
        //                     }
        //                 }
        //             }
        //         }
        //     ],
        //     application_context: {
        //         return_url: 'http://localhost:3000/checkout?url=return&status=approved',
        //         cancel_url: 'http://localhost:3000/checkout?url=cancel&status=notApproved'
        //     }
        // })
        // var requestOptions = {
        //     method: 'POST',
        //     headers: myHeaders,
        //     body: raw,
        //     redirect: 'follow'
        // }

        // fetch('https://api-m.sandbox.paypal.com/v2/checkout/orders', requestOptions)
        //     .then((response) => response.json())
        //     .then((result) => {
        //         localStorage.setItem('isEditPayment', 'null')
        //         console.log(result)
        //         captureUrl = result.links[3].href
        //         console.log('captureURL =>' + captureUrl)
        //         func(captureUrl)
        //         // document.cookie = 'ApiUrl=' + captureUrl
        //         localStorage.setItem('captureUrl', captureUrl)
        //         console.log(result.links[3].rel)
        //         console.log(result.status)
        //         if (result.status == 'APPROVED') {
    }
    var count = 1
    window.onload = () => {
        console.log('Window is loaded successfully')
    }
    const startload = () => {
        count = count + 1
        const urlParams = new URLSearchParams(window.location.href)
        const paymentStatus = urlParams.get('status')
        var isEditPayment = localStorage.getItem('isEditPayment')
        console.log('isEditPayment ======> ' + isEditPayment)
        console.log('payment is' + paymentStatus)
        if (paymentStatus === 'approved') {
            showCreditCard = false
            dontshowCreditCard = true
            console.log('show credit card =' + showCreditCard)
        }
        if (isEditPayment === 'true' || isEditPayment === 'false') {
            showCreditCard = true
            dontshowCreditCard = false
            console.log('show credit card 2 =' + showCreditCard)
        }
    }
    onload(startload())

    return (
        <form onSubmit={form.handleSubmit(submitForm)}>
            <Stack spacing={8}>
                <Stack spacing={5}>
                    {showCreditCard ? (
                        <Box
                            border="1px solid"
                            borderColor="gray.100"
                            rounded="base"
                            overflow="hidden"
                        >
                            <RadioGroup
                                className="radioGroup"
                                onChange={handleSelection}
                                value={value}
                            >
                                <Box
                                    py={3}
                                    px={[4, 4, 6]}
                                    bg="gray.50"
                                    borderBottom="1px solid"
                                    borderColor="gray.100"
                                >
                                    <Radio value="cc">
                                        <Flex justify="space-between">
                                            <Stack direction="row" align="center">
                                                <Text fontWeight="bold">
                                                    <FormattedMessage
                                                        defaultMessage="Credit Card"
                                                        id="payment_selection.heading.credit_card"
                                                    />
                                                </Text>
                                                <Tooltip
                                                    hasArrow
                                                    placement="top"
                                                    label={formatMessage({
                                                        defaultMessage:
                                                            'This is a secure SSL encrypted payment.',
                                                        id:
                                                            'payment_selection.tooltip.secure_payment'
                                                    })}
                                                >
                                                    <LockIcon color="gray.700" boxSize={5} />
                                                </Tooltip>
                                            </Stack>
                                            <Text fontWeight="bold">
                                                <FormattedNumber
                                                    value={basket.orderTotal}
                                                    style="currency"
                                                    currency={basket.currency}
                                                />
                                                <input
                                                    type="hidden"
                                                    className="orderTotal"
                                                    value={basket.orderTotal}
                                                ></input>
                                            </Text>
                                        </Flex>
                                    </Radio>
                                </Box>

                                {showCreditCard ? (
                                    <Box
                                        p={[4, 4, 6]}
                                        borderBottom="1px solid"
                                        borderColor="gray.100"
                                    >
                                        <Stack spacing={6}>
                                            {hasSavedCards && (
                                                <Controller
                                                    name="paymentInstrumentId"
                                                    defaultValue=""
                                                    control={form.control}
                                                    rules={{
                                                        required: !isEditingPayment
                                                            ? formatMessage({
                                                                  defaultMessage:
                                                                      'Please select a payment method.',
                                                                  id:
                                                                      'payment_selection.message.select_payment_method'
                                                              })
                                                            : false
                                                    }}
                                                    render={({value}) => (
                                                        <CCRadioGroup
                                                            form={form}
                                                            value={value}
                                                            isEditingPayment={isEditingPayment}
                                                            togglePaymentEdit={togglePaymentEdit}
                                                            onPaymentIdChange={onPaymentIdChange}
                                                        />
                                                    )}
                                                />
                                            )}

                                            {isEditingPayment && (
                                                <Box
                                                    {...(hasSavedCards && {
                                                        px: [4, 4, 6],
                                                        py: 6,
                                                        rounded: 'base',
                                                        border: '1px solid',
                                                        borderColor: 'blue.600'
                                                    })}
                                                >
                                                    <Stack spacing={6}>
                                                        {hasSavedCards && (
                                                            <Heading as="h3" size="sm">
                                                                <FormattedMessage
                                                                    defaultMessage="Add New Card"
                                                                    id="payment_selection.heading.add_new_card"
                                                                />
                                                            </Heading>
                                                        )}
                                                        <CreditCardFields form={form} />

                                                        {!hideSubmitButton && (
                                                            <Box>
                                                                <Container variant="form">
                                                                    <Button
                                                                        isLoading={
                                                                            form.formState
                                                                                .isSubmitting
                                                                        }
                                                                        type="submit"
                                                                        w="full"
                                                                    >
                                                                        <FormattedMessage
                                                                            defaultMessage="Save & Continue"
                                                                            id="payment_selection.button.save_and_continue"
                                                                        />
                                                                    </Button>
                                                                </Container>
                                                            </Box>
                                                        )}
                                                    </Stack>
                                                </Box>
                                            )}
                                        </Stack>
                                    </Box>
                                ) : null}

                                <Box py={3} px={[4, 4, 6]} bg="gray.50" borderColor="gray.100">
                                    <Radio value="paypal">
                                        <Box py="2px">
                                            <PaypalIcon width="auto" height="20px" />
                                        </Box>
                                    </Radio>
                                </Box>
                            </RadioGroup>
                        </Box>
                    ) : null}
                </Stack>
                {dontshowCreditCard ? (
                    <Box border="1px solid" borderColor="gray.100" rounded="base" overflow="hidden">
                        <RadioGroup
                            className="radioGroup"
                            onChange={handleSelection}
                            value={value1}
                        >
                            <Box py={3} px={[4, 4, 6]} bg="gray.50" borderColor="gray.100">
                                <Radio value="paypal">
                                    <Box py="2px">
                                        <PaypalIcon width="auto" height="20px" />
                                    </Box>
                                </Radio>
                            </Box>
                        </RadioGroup>
                    </Box>
                ) : null}
            </Stack>
        </form>
    )
}

export default PaymentSelection
