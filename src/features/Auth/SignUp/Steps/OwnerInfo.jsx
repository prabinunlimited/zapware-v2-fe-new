import React from "react";
import { FieldArray } from "formik";
import FormField from "../../Auth/SignUp/FormFields/FormField";
import SelectField from "../../Auth/SignUp/FormFields/SelectField";

const OwnerInfo = ({
  values,
  setFieldValue,
  handleChange,
  handleBlur,
  errors,
  touched,
  activeField,
  setActiveField,
  nationalityOptions,
  roleOptions,
  idDocumentTypeOptions,
  totalOwnershipPercentage,
  dispatch,
}) => {
  const handleOwnerFileChange = (e, ownerIndex, documentId) => {
    const file = e.target.files[0];
    if (file) {
      dispatch(
        setOwnerField({
          index: ownerIndex,
          field: "doc_file",
          value: file,
        })
      );
    }
  };

  return (
    <>
      <h2 className="text-xl font-semibold mb-4">Owner Information</h2>
      <p className="text-sm text-gray-600 mb-4">
        Add all owners with 25% or more ownership in the business. Total
        ownership must equal 100%.
      </p>

      <FieldArray name="owner_details">
        {({ push, remove }) => (
          <div className="space-y-6">
            {values.owner_details.map((owner, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Owner {index + 1}</h3>
                  {values.owner_details.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        remove(index);
                        dispatch(removeOwner(index));
                      }}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove Owner
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    id={`owner_details[${index}].owner_first_name`}
                    label="First Name"
                    name={`owner_details[${index}].owner_first_name`}
                    value={owner.owner_first_name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onFocus={() =>
                      setActiveField(`owner_details[${index}].owner_first_name`)
                    }
                    touched={touched.owner_details?.[index]?.owner_first_name}
                    error={errors.owner_details?.[index]?.owner_first_name}
                    required
                    activeField={activeField}
                  />

                  <FormField
                    id={`owner_details[${index}].owner_last_name`}
                    label="Last Name"
                    name={`owner_details[${index}].owner_last_name`}
                    value={owner.owner_last_name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onFocus={() =>
                      setActiveField(`owner_details[${index}].owner_last_name`)
                    }
                    touched={touched.owner_details?.[index]?.owner_last_name}
                    error={errors.owner_details?.[index]?.owner_last_name}
                    required
                    activeField={activeField}
                  />

                  <FormField
                    id={`owner_details[${index}].owner_email`}
                    label="Email Address"
                    name={`owner_details[${index}].owner_email`}
                    type="email"
                    value={owner.owner_email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onFocus={() =>
                      setActiveField(`owner_details[${index}].owner_email`)
                    }
                    touched={touched.owner_details?.[index]?.owner_email}
                    error={errors.owner_details?.[index]?.owner_email}
                    required
                    activeField={activeField}
                  />

                  <FormField
                    id={`owner_details[${index}].owner_phone_number`}
                    label="Phone Number"
                    name={`owner_details[${index}].owner_phone_number`}
                    value={owner.owner_phone_number}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onFocus={() =>
                      setActiveField(
                        `owner_details[${index}].owner_phone_number`
                      )
                    }
                    touched={touched.owner_details?.[index]?.owner_phone_number}
                    error={errors.owner_details?.[index]?.owner_phone_number}
                    required
                    activeField={activeField}
                  />

                  <SelectField
                    id={`owner_details[${index}].owner_country_id`}
                    label="Country"
                    options={nationalityOptions}
                    onChange={(option) =>
                      setFieldValue(
                        `owner_details[${index}].owner_country_id`,
                        option?.value
                      )
                    }
                    value={nationalityOptions.find(
                      (opt) => opt.value === owner.owner_country_id
                    )}
                    touched={touched.owner_details?.[index]?.owner_country_id}
                    error={errors.owner_details?.[index]?.owner_country_id}
                    required
                  />

                  <SelectField
                    id={`owner_details[${index}].owner_role_id`}
                    label="Role"
                    options={roleOptions}
                    onChange={(option) =>
                      setFieldValue(
                        `owner_details[${index}].owner_role_id`,
                        option?.value
                      )
                    }
                    value={roleOptions.find(
                      (opt) => opt.value === owner.owner_role_id
                    )}
                    touched={touched.owner_details?.[index]?.owner_role_id}
                    error={errors.owner_details?.[index]?.owner_role_id}
                    required
                  />

                  <FormField
                    id={`owner_details[${index}].ownership_percentage`}
                    label="Ownership Percentage"
                    name={`owner_details[${index}].ownership_percentage`}
                    type="number"
                    value={owner.ownership_percentage}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onFocus={() =>
                      setActiveField(
                        `owner_details[${index}].ownership_percentage`
                      )
                    }
                    touched={
                      touched.owner_details?.[index]?.ownership_percentage
                    }
                    error={errors.owner_details?.[index]?.ownership_percentage}
                    required
                    min="0"
                    max="100"
                    step="0.01"
                    activeField={activeField}
                  />

                  <FormField
                    id={`owner_details[${index}].owner_dob`}
                    label="Date of Birth"
                    name={`owner_details[${index}].owner_dob`}
                    type="date"
                    value={owner.owner_dob}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onFocus={() =>
                      setActiveField(`owner_details[${index}].owner_dob`)
                    }
                    touched={tounded.owner_details?.[index]?.owner_dob}
                    error={errors.owner_details?.[index]?.owner_dob}
                    required
                    activeField={activeField}
                  />

                  {owner.owner_country_id === "United States" && (
                    <FormField
                      id={`owner_details[${index}].ssn`}
                      label="SSN (Social Security Number)"
                      name={`owner_details[${index}].ssn`}
                      value={owner.ssn}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      onFocus={() =>
                        setActiveField(`owner_details[${index}].ssn`)
                      }
                      touched={touched.owner_details?.[index]?.ssn}
                      error={errors.owner_details?.[index]?.ssn}
                      required={owner.owner_country_id === "United States"}
                      placeholder="XXX-XX-XXXX"
                      activeField={activeField}
                    />
                  )}

                  <SelectField
                    id={`owner_details[${index}].doc_type`}
                    label="ID Document Type"
                    options={idDocumentTypeOptions}
                    onChange={(option) =>
                      setFieldValue(
                        `owner_details[${index}].doc_type`,
                        option?.value
                      )
                    }
                    value={idDocumentTypeOptions.find(
                      (opt) => opt.value === owner.doc_type
                    )}
                    touched={touched.owner_details?.[index]?.doc_type}
                    error={errors.owner_details?.[index]?.doc_type}
                    required
                  />

                  <FormField
                    id={`owner_details[${index}].doc_id`}
                    label="Document ID Number"
                    name={`owner_details[${index}].doc_id`}
                    value={owner.doc_id}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onFocus={() =>
                      setActiveField(`owner_details[${index}].doc_id`)
                    }
                    touched={touched.owner_details?.[index]?.doc_id}
                    error={errors.owner_details?.[index]?.doc_id}
                    required
                    activeField={activeField}
                  />

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload ID Document
                    </label>
                    <input
                      type="file"
                      onChange={(e) =>
                        handleOwnerFileChange(e, index, owner.doc_type)
                      }
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      accept=".jpg,.jpeg,.png,.pdf"
                    />
                    {owner.doc_file && (
                      <p className="text-sm text-green-600 mt-1">
                        File selected: {owner.doc_file.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={() => {
                push({
                  owner_type: "individual",
                  owner_first_name: "",
                  owner_last_name: "",
                  owner_email: "",
                  owner_phone_number: "",
                  owner_country_id: "",
                  owner_role_id: "",
                  ownership_percentage: 0,
                  owner_dob: "",
                  ssn: "",
                  doc_type: "",
                  doc_id: "",
                  doc_file: null,
                });
                dispatch(addOwner());
              }}
              className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 transition duration-200"
            >
              + Add Another Owner
            </button>

            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-blue-800">
                Total Ownership: {totalOwnershipPercentage}%
                {totalOwnershipPercentage !== 100 && (
                  <span className="text-red-600 ml-2">(Must equal 100%)</span>
                )}
              </p>
            </div>
          </div>
        )}
      </FieldArray>
    </>
  );
};

export default OwnerInfo;
