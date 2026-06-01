const rawBase64 = `MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDBo2YIBD2Qz8zG
6aau3w+IV6/cI5YuybN5bR4PjbvW0OZDma0mfQO5yUeFbx65rsD+SNUQCrhDF8Jb
Pi2ri13+JkNC1hVGV4D3ThOyO01IMqpQII1ozPHq4zLPvKVp1ILpwxVzD8BIX1Ov
Dl39+fJHaVjIhLAWGPXepW5z2M7aZLIWvf+HyWt4XTzOf+23sKSJkA7SGapba5zG
oMLWQv8vg9OaNwPC0zSnE9u3ktfuqmN3d/+/YZrGv81dnQtImU3fZwRaNkUVYLLI
VM5uAGIYf1tgHdhzdtx35UCA7Wng6aXnPPKA5+jaMHjyHgbcjDujDdBOfZ1SZdLg
h134hrkDAgMBAAECggEAXCuF1o0GLRbsd0YiZByjDRgICnYZ931k44iQBYFGhvL6
l/TfWXGqQ1XOqHIDIwlOrftHB5LCsJTvm3TWUlBNVjsqSvcSO2BNb+oHMBBQMeyD
6w4DoX3kLRUmS4GVDvHruo90d0dpFEnj0HC7RrghneJEM3YNRwdsiSUflR7/Hy54
+mn8Cfgzryi5AppMbaf2pyJea2EHhjj3qk7lUbMNosxHC527DbzMNbs2SnCmyzYD
Xbx2qEE7xnQxEG+CIRUEKRfn9NgSr5FNJjwdeLMMsMKTtj3S3+kKy26t3lIR4Wii
c2FaI60DGL5VJtw37rMk0Jm/sWe2SkzObGkfqoEUiQKBgQDof04iY7vvIDSp4tCC
s6sLAtw7RaVzUVYFtIN3pEsb6JjEd0JcT9ulCqPaDV53o/OuLr+0yIYcSFiCkIhA
q6J1XSkPii6GMAOydnWMTyEO7uArgQ4EEqFqEx6z4BYI8486KtWUjs9NWKw5gY8v
TNwlodaAgFY2eQlXz3gjFTG6pwKBgQDVNnpnx+aKcKjbC14mPOXDro+bVionE2cf
nPwgqSmmJPLXIwDFmoXljKSAVcfuT0jyK03OC6wqAGLnWKGO9sxZuKzQ05hbEcDEZ
XqOf3UQKEcFa0TBEytQxlV7I2vntFMGeNrKj8kib2kQIgyrKcJnobaKNFvl9PHQJ
Feeuu7SGRQKBgQClgFniaRSS+F4EwQykvbj4MaUMHFvWZwPRM9qSBEXjLAPzduGq
TL6SEazpv7KLgA4q4+RbkJLG90jqSHB1eLhAy3w7L6ZGp086btDmfD2QH8M7tLaB
d7GnjMzCRrXo0VgXk/5Nrgsrh/+xP+TpStE7iKTk/HZieG6KL4nZj3DC6QKBgBGP
uSlPJ8gDW4UfPJP9tBcYC7AJutMZIAdM08lX87VgEMEGQ4tmhW8Ldh8OEmCsklwE
6qC/50+BudzP2tdHJvPQDy7EPN/VNdYXG3cRbIc/yyNF06n24t9qpDH7B1blvMTh
UHl8fUqJAc2JsD6YY7TnQtikICiOkCgna7vSrh3ZAoGAS4HIUJeGZLMFxWhezhNQ
Jz9SFhcvA9qCL3w8F0Xd/N3tVc2AV3cCLuvFpEMDLb1rMMhtRyXBznCgvT8GO+z2
ATDondZq1IxR3ckuONkNp76wdV9+0x3qHwN3iS+SSmxsKuaNt5o49ys05r2SeaWD
pj/x1KSmzHFW8eUNevfHpnQ=`;

const base64 = rawBase64.replace(/\s+/g, '');
const buffer = Buffer.from(base64, 'base64');

// We want to extract integers from the RSAPrivateKey structure.
// In DER, an integer starts with 02, followed by length (1 or 2 bytes), followed by value bytes.
function parseDerIntegers(der) {
  let offset = 0;
  
  if (der[offset] !== 0x30) throw new Error("Not a SEQUENCE");
  offset++;
  if (der[offset] & 0x80) {
    offset += (der[offset] & 0x7f) + 1;
  } else {
    offset++;
  }
  
  if (der[offset] !== 0x02 || der[offset+1] !== 0x01) throw new Error("Expected Version INTEGER");
  offset += 3;
  
  const integers = [];
  while (offset < der.length) {
    const tagOffset = offset;
    if (der[offset] !== 0x02) {
      console.log("Non-integer tag at offset", offset, "value:", der[offset].toString(16), "Context:", der.slice(offset - 10, offset + 15).toString('hex'));
      break;
    }
    offset++;
    
    let len = 0;
    if (der[offset] & 0x80) {
      const lenBytes = der[offset] & 0x7f;
      offset++;
      for (let i = 0; i < lenBytes; i++) {
        len = (len << 8) | der[offset];
        offset++;
      }
    } else {
      len = der[offset];
      offset++;
    }
    
    const value = der.slice(offset, offset + len);
    integers.push({ name: 'int-' + integers.length, hex: value.toString('hex'), tagOffset, len });
    offset += len;
  }
  return integers;
}

const rsaDer = buffer.slice(26);
const ints = parseDerIntegers(rsaDer);
ints.forEach((item, idx) => {
  console.log(`Component ${idx} (len=${item.len}): offset=${item.tagOffset}, start=${item.hex.substring(0, 20)}...`);
});
